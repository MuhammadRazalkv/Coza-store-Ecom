const User = require('../../model/userModel')
const Razorpay = require('razorpay')
const mongoose = require('mongoose')
const productDB = require('../../model/productModel')
const variantDB = require('../../model/variantModel')
const AddressDB = require('../../model/addressModal')
const CartDB = require('../../model/cartModel')
const OrderDB = require('../../model/orderModal')
const WishlistDB = require('../../model/wishlistModel')
const CouponDB = require('../../model/couponModal')
const dotenv = require('dotenv')
const crypto = require('crypto')
const WalletDB = require('../../model/walletModel')
dotenv.config()
const { ObjectId } = require('mongodb')

function isValidObjectId (id) {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id
}


const loadCheckOutPage = async (req, res,next) => {
  try {
    const userId = req.session.user_id

    const cart = await CartDB.findOne({ userId }).populate(
      'cartItems.productVariantId'
    )
    const addressData = await AddressDB.findOne({ userId })

    if (!userId || !cart || !cart.cartItems.length) {
      return res.redirect('/cart')
    }

    const stock = cart.cartItems.filter(
      item =>
        item.productVariantId.variantListed &&
        item.productVariantId.variantStock > 0
    )

    const quantityPrice = stock.map(
      item => item.productVariantId.variantDiscountPrice * item.quantity
    )

    const cartSubTotal = quantityPrice.reduce((acc, curr) => acc + curr, 0)

    const deliveryCharge = cartSubTotal < 5000 ? 100 : 'Free delivery'

    let offerDiscount = 0

    stock.forEach(item => {
      const originalPrice = parseFloat(
        item.productVariantId.variantDiscountPrice
      )

      if (
        item.productVariantId.categoryOffer &&
        item.productVariantId.categoryOffer.listed &&
        item.productVariantId.categoryOffer.discountPercentage
      ) {
        const discountPercentage = parseFloat(
          item.productVariantId.categoryOffer.discountPercentage
        )
        offerDiscount +=
          originalPrice * (discountPercentage / 100) * item.quantity
      }

      if (
        item.productVariantId.productOffer &&
        item.productVariantId.productOffer.listed &&
        item.productVariantId.productOffer.discountPercentage
      ) {
        const discountPercentage = parseFloat(
          item.productVariantId.productOffer.discountPercentage
        )
        offerDiscount +=
          originalPrice * (discountPercentage / 100) * item.quantity
      }
    })

    let grandTotal =
      parseInt(deliveryCharge) === 100
        ? cartSubTotal + deliveryCharge
        : cartSubTotal

    const coupons = await CouponDB.find({ listed: true })

    grandTotal -= offerDiscount

   

    res.render('checkout', {
      cart,
      deliveryCharge,
      addressData,
      cartSubTotal,
      offerDiscount,
      grandTotal,
      coupons,
      message: undefined
    })
  } catch (error) {
    next(error)
  }
}

const applyCoupon = async (req, res,error) => {
  try {
    const { couponCode, cartSubTotal } = req.body

    parseInt(cartSubTotal)

    const coupon = await CouponDB.findOne({ couponCode: couponCode })

    if (!coupon || !coupon.listed) {
      return res
        .status(400)
        .json({ success: false, message: 'Coupon is not valid' })
    } else if (coupon.minPurchaseAmount > cartSubTotal) {
      return res.status(400).json({
        success: false,
        message: 'Minimum purchase amount not reached'
      })
    } else {
      let couponDiscount = null

      // Calculate discount based on percentage and check against maxRedeemAmount
      const discountAmount = (cartSubTotal * coupon.discountPercentage) / 100

      if (discountAmount > coupon.maxRedeemAmount) {
        couponDiscount = coupon.maxRedeemAmount
      } else {
        couponDiscount = discountAmount
      }

      return res.status(200).json({
        success: true,
        message: 'Coupon applied successfully',
        couponDiscount: couponDiscount
      })
    }
  } catch (error) {
    next(error)
  }
}

const placeOrder = async (req, res,next) => {
  const userId = req.session.user_id
  const { selectedOption, addressId, appliedCoupon } = req.body

  if (!selectedOption) {
    return res
      .status(400)
      .json({ success: false, message: 'Please select a Payment method' })
  }

  try {
    const cart = await CartDB.findOne({ userId: userId })
      .populate({
        path: 'cartItems.productVariantId',
        populate: {
          path: 'productId',
          populate: {
            path: 'categoryId'
          }
        }
      })
      .exec()


    if (!cart || !cart.cartItems.length) {
      return res.status(400).json({
        success: false,
        message: 'No item found in cart. Please add products to the cart.'
      })
    }

    const stock = cart.cartItems.filter(item => {
      if (!item.productVariantId) return false
      if (!item.productVariantId.variantListed) return false
      if (item.productVariantId.variantStock <= 0) return false
      return true
    })

    const quantityPrice = stock.map(
      item => item.productVariantId.variantDiscountPrice * item.quantity
    )
    const cartSubTotal = quantityPrice.reduce((curr, pre) => curr + pre, 0)
    const deliveryCharge = cartSubTotal < 5000 ? 100 : 0
    let grandTotal = cartSubTotal + deliveryCharge

    if (cartSubTotal > 1000 && selectedOption == 'COD') {
      return res
        .status(400)
        .json({ message: 'Order above 1000 is not eligible for COD ' })
    }
    // Address management

    const address = await AddressDB.findOne({
      userId: userId,
      'addresses._id': addressId
    })

    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Selected address does not exist. Please choose another one.'
      })
    }

    const shippingAddress = address.addresses.find(
      item => item._id.toString() === addressId
    )

    // order array item saving
    const orderItems = stock.map(item => ({
      productId: item.productVariantId.productId._id,
      variantId: item.productVariantId._id,
      variantName: item.productVariantId.variantName,
      variantPrice: item.productVariantId.variantDiscountPrice,
      quantity: item.quantity,
      orderStatus:
        selectedOption === 'Online-Payment' ? 'Pending' : 'Processing',
      offerDiscount: 0,
      categoryName: item.productVariantId.productId.categoryId.name
    }))

    let offerDiscount = 0

    // stock.forEach(item => {
    //   const originalPrice = parseFloat(item.productVariantId.variantDiscountPrice);

    //   if (item.productVariantId.categoryOffer && item.productVariantId.categoryOffer.listed && item.productVariantId.categoryOffer.discountPercentage) {
    //     const discountPercentage = parseFloat(item.productVariantId.categoryOffer.discountPercentage);
    //     offerDiscount += originalPrice * (discountPercentage / 100) * item.quantity;

    //   }

    //   if (item.productVariantId.productOffer && item.productVariantId.productOffer.listed && item.productVariantId.productOffer.discountPercentage) {
    //     const discountPercentage = parseFloat(item.productVariantId.productOffer.discountPercentage);
    //     offerDiscount += originalPrice * (discountPercentage / 100) * item.quantity;

    //   }
    // });
    stock.forEach((item, index) => {
      const originalPrice = parseFloat(
        item.productVariantId.variantDiscountPrice
      )

      if (
        item.productVariantId.categoryOffer &&
        item.productVariantId.categoryOffer.listed &&
        item.productVariantId.categoryOffer.discountPercentage
      ) {
        const discountPercentage = parseFloat(
          item.productVariantId.categoryOffer.discountPercentage
        )
        const discount =
          originalPrice * (discountPercentage / 100) * item.quantity
        offerDiscount += discount
        orderItems[index].offerDiscount += discount // Update the offerDiscount in orderItems
      }

      if (
        item.productVariantId.productOffer &&
        item.productVariantId.productOffer.listed &&
        item.productVariantId.productOffer.discountPercentage
      ) {
        const discountPercentage = parseFloat(
          item.productVariantId.productOffer.discountPercentage
        )
        const discount =
          originalPrice * (discountPercentage / 100) * item.quantity
        offerDiscount += discount
        orderItems[index].offerDiscount += discount // Update the offerDiscount in orderItems
      }
    })

    // coupon finding
    grandTotal -= offerDiscount

    // console.log('orderItems',orderItems);
    let couponDetails = {}
    if (appliedCoupon) {
      const coupon = await CouponDB.findOne({ couponCode: appliedCoupon })

      if (!coupon || !coupon.listed) {
        return res
          .status(400)
          .json({ success: false, message: 'Coupon is not valid' })
      }

      const discountAmount = (cartSubTotal * coupon.discountPercentage) / 100
      const couponDiscount = Math.min(
        discountAmount,
        coupon.maxRedeemAmount || coupon.maxRedeemAmount
      )

      couponDetails = {
        maxRedeemAmount: coupon.maxRedeemAmount,
        discountPercentage: coupon.discountPercentage,
        claimedAmount: couponDiscount,
        couponCode: coupon.couponCode,
        minPurchaseAmount: coupon.minPurchaseAmount
      }

      grandTotal -= couponDiscount
    }

    // order saving

    const OrderData = new OrderDB({
      userId: userId,
      orderItems: orderItems,
      paymentMethod: selectedOption,
      subTotal: cartSubTotal,
      deliveryCharge: deliveryCharge,
      grandTotal: grandTotal,
      shippingAddress: shippingAddress,
      couponDetails: couponDetails,
      TotalOfferDiscount: offerDiscount
    })

    const placedOrder = await OrderData.save()
    const orderId = placedOrder._id

    if (placedOrder) {
      for (const element of stock) {
        await variantDB.findByIdAndUpdate(element.productVariantId._id, {
          $inc: { variantStock: -element.quantity }
        })

        await CartDB.updateOne(
          { userId: userId },
          {
            $pull: {
              cartItems: { productVariantId: element.productVariantId._id }
            }
          }
        )
      }
    }

    if (selectedOption == 'COD') {
      res
        .status(200)
        .json({ success: true, message: 'Order successfully placed', orderId })
    } else {
      const grandTotal = placedOrder.grandTotal

      var instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEYID,
        key_secret: process.env.RAZORPAY_KEYSECRET
      })

      const order = await instance.orders.create({
        amount: grandTotal * 100,
        currency: 'INR',
        receipt: orderId.toString(),
        payment_capture: 1
      })
     
      return res.json({
        order,
        placedOrder,
        KEY: process.env.RAZORPAY_KEYID,
        orderId
      })
    }
  } catch (error) {
    next(error)
  }
}

const verifyPayment = async (req, res,next) => {
  try {
 
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id
    } = req.body

    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEYSECRET)
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`)
    const digest = shasum.digest('hex')
   
    //CHECKING PAYMENT IS VERIFIED
    if (digest === razorpay_signature) {
      // UPDATING FEILD
      await OrderDB.findByIdAndUpdate(
        order_id,
        {
          'orderItems.$[].orderStatus': 'Processing'
          // razorPayment_id: razorpay_payment_id
        },
        { upsert: true, new: true }
      )

      return res
        .status(200)
        .json({ order_id, message: 'Payment successful and Order placed' })
    } else {
      return res.status(400).json({ message: 'Failed' })
    }
  } catch (error) {
    next(error)
  }
}

const loadOrderPage = async (req, res,next) => {
  try {
    const limit = 3;
    const page = Math.max(1, parseInt(req.query.page)) || 1;
    const skip = (page - 1) * limit;

    const userId = req.session.user_id
    const orders = await OrderDB.find({ userId: userId })
      .populate('userId')
      .populate('orderItems.variantId')
      .sort({ createdAt: -1 }).skip(skip).limit(limit)

    if (!orders) {
      return res
        .status(400)
        .json({ success: false, message: 'No Order data found' })
    }

    const count = await OrderDB.countDocuments({userId:userId})
    const totalPages = Math.ceil(count / limit);

    res.render('orderPage', { orders, message: undefined , page, totalPages})
  } catch (error) {
    next(error)
  }
}


const cancelOrder = async (req, res,next) => {
  try {
    const userId = req.session.user_id
    const { orderId, variantObjectId } = req.body

    const order = await OrderDB.findById(orderId)
    if (!order) {
      return res
        .status(400)
        .json({ success: false, message: 'Order not found' })
    }

    const orderItem = await OrderDB.findOne(
      { _id: orderId, 'orderItems._id': variantObjectId },
      { 'orderItems.$': 1 }
    )

    if (!orderItem) {
      return res
        .status(400)
        .json({ success: false, message: 'Product not found' })
    }

    const orderData = orderItem.orderItems[0]
    const variantId = orderData.variantId
    const variantQuantity = orderData.quantity
    const originalPrice = orderData.variantPrice
    const offerDiscount = orderData.offerDiscount
    let totalOfferDiscount = order.TotalOfferDiscount - offerDiscount
   
    // Update variant stock
    await variantDB.findByIdAndUpdate(variantId, {
      $inc: {
        variantStock: variantQuantity
      }
    })

    const totalVariantPrice = originalPrice * variantQuantity
    const totalVariantPriceAfterDiscount = totalVariantPrice - offerDiscount
    // Update order totals: Subtotal without considering offer discount
    const newSubTotal = await OrderDB.findOneAndUpdate(
      { _id: orderId, 'orderItems._id': variantObjectId },
      {
        $inc: {
          subTotal: -totalVariantPrice 
        }
      },
      { new: true }
    )
   

    let deliveryCharge = newSubTotal.subTotal > 5000 ? 0 : 100
    let dCount = newSubTotal.orderItems.filter((item)=> item.orderStatus !== 'Cancelled' ).length
 

    if (dCount > 1  ) {
      deliveryCharge = 0
    }
   
    


    // const newGrandTotal = parseInt(newSubTotal.subTotal + deliveryCharge - totalOfferDiscount);
    const newGrandTotal = parseInt(
      newSubTotal.subTotal + deliveryCharge - offerDiscount
    )
    if (newGrandTotal == 0) {
      totalOfferDiscount = 0 
    }
    

    await OrderDB.findOneAndUpdate(
      { _id: orderId },
      {
        $set: {
          grandTotal: newGrandTotal,
          deliveryCharge: deliveryCharge,
          TotalOfferDiscount: totalOfferDiscount
        }
      }
    )

    const appliedCoupon = await OrderDB.findOne(
      { _id: orderId, couponDetails: { $exists: true } },
      { couponDetails: 1, _id: 0 }
    )

    if (appliedCoupon && appliedCoupon.couponDetails) {
      const minPurchaseAmount = appliedCoupon.couponDetails.minPurchaseAmount

      if (minPurchaseAmount > newSubTotal.subTotal) {
        const grandTotal = order.grandTotal

        await OrderDB.findByIdAndUpdate(
          orderId,
          {
            $unset: { couponDetails: '' }
          },
          { new: true }
        )

        if (order.paymentMethod == 'Online-Payment') {
          const cancelOrder = await OrderDB.updateMany(
            { _id: orderId },
            {
              $set: {
                grandTotal: 0,
                deliveryCharge: 0,
                'orderItems.$[elem].orderStatus': 'Cancelled',
                'orderItems.$[elem].cancelledOrRefunded': true
              }
            },
            {
              arrayFilters: [{ 'elem._id': { $exists: true } }]
            }
          )

          if (cancelOrder) {
            const refund = await WalletDB.findOneAndUpdate(
              { userId: userId },
              {
                $push: {
                  transactions: {
                    amount: grandTotal,
                    transactionMethod: 'Cancelled'
                  }
                },
                $inc: { balance: grandTotal }
              },
              { upsert: true, new: true }
            )

            return res.status(200).json({
              message: 'Order cancelled successfully',
              success: true
            })
          } else {
            return res
              .status(400)
              .json({ success: false, message: 'Failed to cancel order' })
          }
        } else {
          await OrderDB.findOneAndUpdate(
            { _id: orderId, 'orderItems._id': variantObjectId },
            {
              $set: {
                'orderItems.$.cancelledOrRefunded': true,
                'orderItems.$.orderStatus': 'Cancelled'
              }
            },
            { new: true }
          )

          return res
            .status(200)
            .json({ message: 'Order cancelled successfully' })
        }
      } else {
        const grandTotal = newGrandTotal

        const productCount = await OrderDB.findOne(
          { _id: orderId },
          { orderItems: 1 }
        )

        const nonCancelledItemsCount = productCount.orderItems.filter(
          item => !item.cancelledOrRefunded
        ).length

        const claimedAmount =
          (order.subTotal * appliedCoupon.couponDetails.discountPercentage) /
          100
        const couponDiscountPerItem = claimedAmount / nonCancelledItemsCount

        const discountAmount =
          (newSubTotal.subTotal *
            appliedCoupon.couponDetails.discountPercentage) /
          100
        const couponDiscount = Math.min(
          discountAmount,
          appliedCoupon.couponDetails.maxDiscountAmount ||
            appliedCoupon.couponDetails.maxRedeemAmount
        )
        const finalGrandTotal = parseInt(grandTotal - couponDiscount)
        const amountToRefund = parseInt(
          totalVariantPriceAfterDiscount - couponDiscountPerItem + parseInt(deliveryCharge)
        )
       
        await OrderDB.findByIdAndUpdate(
          orderId,
          {
            $set: {
              'couponDetails.claimedAmount': couponDiscount
            }
          },
          { new: true }
        )

        if (order.paymentMethod == 'Online-Payment') {
          await OrderDB.findByIdAndUpdate(orderId, {
            $set: {
              subTotal: newSubTotal.subTotal,
              grandTotal: finalGrandTotal,
              deliveryCharge: deliveryCharge
            }
          })

          await OrderDB.findOneAndUpdate(
            { _id: orderId, 'orderItems._id': variantObjectId },
            {
              $set: {
                'orderItems.$.orderStatus': 'Cancelled',
                'orderItems.$.cancelledOrRefunded': true
              }
            },
            { new: true }
          )

          const refund = await WalletDB.findOneAndUpdate(
            { userId: userId },
            {
              $push: {
                transactions: {
                  amount: amountToRefund,
                  transactionMethod: 'Cancelled'
                }
              },
              $inc: { balance: amountToRefund }
            },
            { upsert: true, new: true }
          )

          if (refund) {
            return res.status(200).json({
              success: true,
              message: 'Order cancelled successfully and amount refunded'
            })
          }
        } else {
          await OrderDB.findOneAndUpdate(
            { _id: orderId, 'orderItems._id': variantObjectId },
            {
              $set: {
                'orderItems.$.cancelledOrRefunded': true,
                'orderItems.$.orderStatus': 'Cancelled'
              }
            },
            { new: true }
          )

          return res
            .status(200)
            .json({ message: 'Order cancelled successfully' })
        }
      }
    } else {
      await OrderDB.findOneAndUpdate(
        { _id: orderId, 'orderItems._id': variantObjectId },
        {
          $set: {
            'orderItems.$.cancelledOrRefunded': true,
            'orderItems.$.orderStatus': 'Cancelled'
          }
        },
        { new: true }
      )

      if (order.paymentMethod == 'Online-Payment') {
        const refund = await WalletDB.findOneAndUpdate(
          { userId: userId },
          {
            $push: {
              transactions: {
                amount: totalVariantPriceAfterDiscount + parseInt(deliveryCharge),
                transactionMethod: 'Cancelled'
              }
            },
            $inc: { balance: totalVariantPriceAfterDiscount +  + parseInt(deliveryCharge)}
          },
          { upsert: true, new: true }
        )

        if (refund) {
          return res.status(200).json({
            success: true,
            message: 'Order cancelled successfully and amount refunded'
          })
        }
      } else {
        return res
          .status(200)
          .json({ success: true, message: 'Order cancelled successfully' })
      }
    }
  } catch (error) {
    next(error)
  }
}

const loadOrderTrackingPage = async (req, res,next) => {
  try {
    const orderId = req.query.orderId
    
    if (!isValidObjectId(orderId)) {
      return res.redirect('/404error')
    }


    if (!orderId) {
      return res.redirect('/404error')
    }

    const order = await OrderDB.findById(orderId)
      .populate('userId')
      .populate('orderItems.variantId')
      .sort({ createdAt: -1 })

    if (!order) {
      // return res
      //   .status(404)
      //   .json({ message: 'Order not found', success: false })
      return res.redirect('/404error')
    }

    return res.render('orderTracking', { message: undefined, order })
  } catch (error) {
    next(error)
  }
}

const loadWalletPage = async (req, res,next) => {
  try {
    const limit = 5;
    const page = Math.max(1, parseInt(req.query.page)) || 1;
    const skip = (page - 1) * limit;

    const userId = req.session.user_id
    const wallet = await WalletDB.findOne({ userId: userId }).sort({
      createdAt: -1
    }).skip(skip).limit(limit)

    const count = await WalletDB.countDocuments({userId:userId})
    const totalPages = Math.ceil(count / limit)



    res.render('wallet', { wallet, message: undefined , page , totalPages})
  } catch (error) {
    next(error)
  }
}

const loadWishList = async (req, res,next) => {
  try {

    const limit = 5;
    const page = Math.max(1, parseInt(req.query.page)) || 1;
    const skip = (page - 1) * limit;

    const userId = req.session.user_id
    const wishlist = await WishlistDB.findOne({ userId: userId })
      .populate('variantItems.variantId')
      .sort({ createdAt: -1 }).skip(skip).limit(limit)
     
      const count = await WishlistDB.countDocuments({userId:userId})
      const totalPages = Math.ceil(count / limit)


    res.render('wishlist', {
      wishlist,
      message: undefined,
      page,
      totalPages
    })
  } catch (error) {
    next(error)
  }
}

const addToWishlist = async (req, res,next) => {
  try {
    const userId = req.session.user_id
    const { variantId, selectedSize } = req.body
    if (!userId) {
      return res
        .status(400)
        .json({ message: 'User not found , Please reLogin', success: false })
    }
    const variant = await variantDB.findById(variantId)
    if (!variant) {
      return res
        .status(400)
        .json({ success: false, message: 'Product not found' })
    }

    if (!variant.variantSizes.includes(selectedSize)) {
      return res
        .status(400)
        .json({ success: false, message: 'Please select a valid size' })
    }

    const updateData = {
      variantId: variantId,
      selectedSize: selectedSize
    }

    const existingUser = await WishlistDB.findOne({ userId: userId })
    if (existingUser) {
      const existingItem = existingUser.variantItems.find(
        item =>
          item.variantId.toString() === variantId &&
          item.selectedSize === selectedSize
      )

      if (existingItem) {
        return res
          .status(400)
          .json({ success: false, message: 'Item already exists in wishlist' })
      } else {
        existingUser.variantItems.push(updateData)
        await existingUser.save()
      }
    } else {
      const newWishlist = new WishlistDB({
        userId: userId,
        variantItems: [updateData]
      })

      await newWishlist.save()
    }

    return res.status(200).json({
      success: true,
      message: 'Product added to wishlist successfully '
    })
  } catch (error) {
    next(error)
  }
}

const removeFromWishlist = async (req, res,next) => {
  try {
    const userId = req.session.user_id
    const { variantId, selectedSize } = req.params

 

    const updateData = await WishlistDB.findOneAndUpdate(
      { userId: userId },
      {
        $pull: {
          variantItems: { variantId: variantId, selectedSize: selectedSize }
        }
      },
      { new: true }
    )

  
    if (updateData) {
      return res
        .status(200)
        .json({ success: true, message: 'Item removed successfully ' })
    } else {
      return res
        .status(400)
        .json({ success: false, message: 'Product not found' })
    }
  } catch (error) {
    next(error)
  }
}

const requestReturn = async (req, res,next) => {
  try {
    const { orderId, variantId, returnReason } = req.body
    const order = await OrderDB.findOneAndUpdate(
      { _id: orderId, 'orderItems._id': variantId },
      {
        $set: {
          'orderItems.$.returnReason': returnReason,
          'orderItems.$.orderStatus': 'Return requested'
        }
      }
    )
    if (!order) {
      return res
        .status(400)
        .json({ message: 'Order not found ', success: false })
    }

    return res
      .status(200)
      .json({ success: true, message: 'Return requested successfully' })
  } catch (error) {
    next(error)
  }
}

const rePayment = async (req, res,next) => {
  try {
    const { orderId } = req.body
  

    const placedOrder = await OrderDB.findById(orderId)
    if (!orderId || !placedOrder) {
      return res.status(400).json({ message: 'Order not found' })
    }

    const grandTotal = placedOrder.grandTotal

    var instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEYID,
      key_secret: process.env.RAZORPAY_KEYSECRET
    })

    const order = await instance.orders.create({
      amount: grandTotal * 100,
      currency: 'INR',
      receipt: orderId.toString(),
      payment_capture: 1
    })
    // console.log('order', order);
    // console.log('place', placedOrder);

    return res.json({
      order,
      placedOrder,
      KEY: process.env.RAZORPAY_KEYID,
      orderId
    })
  } catch (error) {
    next(error)
  }
}

const downloadInvoice = async (req, res,next) => {
  try {
    const userId = req.session.user_id
    const orderId = req.query.orderId

    if (!isValidObjectId(orderId)) {
      return res.redirect('/orders')
    }

    const orders = await OrderDB.findOne({
      _id: orderId,
      userId: userId,
      orderItems: {
         $elemMatch: { cancelledOrRefunded: false }
       
      }
    })
    
    if (!orders) {
      return res.redirect('/404error')
    }

    const orderCountResult = await OrderDB.aggregate([
    {
      $match: { 
        _id: new ObjectId(orderId), // Convert string to ObjectId
        userId: new ObjectId(userId) // Convert string to ObjectId
      } 
    },
    {$unwind:'$orderItems'},
    {
      $match:{
        'orderItems.cancelledOrRefunded': false
      }
    },
    {$count:'length'}
  
    ]) 

    let completedOrder = await OrderDB.aggregate([
      { 
        $match: { 
          _id: new ObjectId(orderId), // Convert string to ObjectId
          userId: new ObjectId(userId) // Convert string to ObjectId
        } 
      },
      {$unwind:'$orderItems'},
      {
        $match:{
          'orderItems.orderStatus':'Delivered'
        }
      },
      {$project:{'orderItems':1}}
    ]);
  
   


    const countValue = orderCountResult[0].length;

    let subTotal = 0;
    let totalOfferDiscount = 0 
    
    let claimedAmount = orders.couponDetails.claimedAmount || 0 
    let couponAppliedForEachProduct = claimedAmount / countValue
    let couponDis = couponAppliedForEachProduct * completedOrder.length
    
    for (const order of completedOrder) {
      const item = order.orderItems;
      const itemSubtotal = item.quantity * item.variantPrice;
      subTotal += itemSubtotal;
      totalOfferDiscount += item.offerDiscount
    
    }
    let grandTotal = subTotal - totalOfferDiscount - couponDis
    
    let deliveryCharge = orders.deliveryCharge == 100 ? orders.deliveryCharge : 0
    
    grandTotal += parseInt(deliveryCharge)
    

    const currentDate = new Date()
    return res.status(200).render('invoicePage', { orders,completedOrder, currentDate ,subTotal,totalOfferDiscount,couponAppliedForEachProduct,couponDis,grandTotal})
  } catch (error) {
    next(error)
  }
}

module.exports = {
  loadCheckOutPage,
  placeOrder,
  loadOrderPage,
  cancelOrder,
  loadWishList,
  addToWishlist,
  removeFromWishlist,
  applyCoupon,
  verifyPayment,
  loadWalletPage,
  loadOrderTrackingPage,
  requestReturn,
  rePayment,
  downloadInvoice
}
