const variantDB = require("../../model/variantModel");
const AddressDB = require("../../model/addressModal");
const CartDB = require("../../model/cartModel");
const OrderDB = require("../../model/orderModal");
const WishlistDB = require("../../model/wishlistModel");
const CouponDB = require("../../model/couponModal");
const dotenv = require("dotenv");
const crypto = require("crypto");
const WalletDB = require("../../model/walletModel");
dotenv.config();
const { ObjectId } = require("mongodb");
const HttpStatus = require("../../constants/statusCode");
const sendErrorRes = require("../../utils/sendJsonError");
const MESSAGES = require("../../constants/messages");
const sendSuccessRes = require("../../utils/sendSuccessRes");
const { default: mongoose } = require("mongoose");
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function isValidObjectId(id) {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
}

const loadCheckOutPage = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const cart = await CartDB.findOne({ userId }).populate({
      path: "cartItems.productVariantId",
      match: { variantListed: true },
    });
    if (!userId || !cart || !cart.cartItems.length) {
      return res.redirect("/cart");
    }

    cart.cartItems = cart.cartItems.filter((item) => {
      const variant = item.productVariantId;
      if (!variant) return false;

      return variant.sizes.some((s) => s.size === item.selectedSize && s.stock > 0);
    });
    const addressData = await AddressDB.findOne({ userId });

    const cartSubTotal = Math.floor(
      cart.cartItems.reduce(
        (acc, curr) => acc + curr.productVariantId.variantPrice * curr.quantity,
        0
      )
    );

    const deliveryCharge = cartSubTotal < 5000 ? 100 : "Free delivery";

    let offerDiscount = 0;

    cart.cartItems.forEach((item) => {
      const originalPrice = parseFloat(item.productVariantId.variantPrice);
      let bestDiscount = 0;
      if (
        item.productVariantId.categoryOffer &&
        item.productVariantId.categoryOffer.listed &&
        item.productVariantId.categoryOffer.discountPercentage
      ) {
        const discountPercentage = parseFloat(
          item.productVariantId.categoryOffer.discountPercentage
        );
        bestDiscount = originalPrice * (discountPercentage / 100) * item.quantity;
      }

      if (
        item.productVariantId.productOffer &&
        item.productVariantId.productOffer.listed &&
        item.productVariantId.productOffer.discountPercentage
      ) {
        const discountPercentage = parseFloat(
          item.productVariantId.productOffer.discountPercentage
        );
        let discount = originalPrice * (discountPercentage / 100) * item.quantity;
        bestDiscount = Math.max(bestDiscount, discount);
      }

      offerDiscount += Math.round(bestDiscount);
    });

    let grandTotal = Math.round(
      parseInt(deliveryCharge) === 100 ? cartSubTotal + deliveryCharge : cartSubTotal
    );
    const coupons = await CouponDB.find({ listed: true });

    grandTotal -= offerDiscount;

    res.render("checkout", {
      cart,
      deliveryCharge,
      addressData,
      cartSubTotal,
      offerDiscount,
      grandTotal,
      coupons,
      message: undefined,
    });
  } catch (error) {
    next(error);
  }
};

const applyCoupon = async (req, res, next) => {
  try {
    const { couponCode, cartSubTotal } = req.validatedBody;
    const coupon = await CouponDB.findOne({ couponCode: couponCode });
    const date = new Date();
    if (!coupon || !coupon.listed) {
      return sendErrorRes(req, res, HttpStatus.BAD_REQUEST, MESSAGES.INVALID_COUPON);
    } else if (coupon.minPurchaseAmount > cartSubTotal) {
      return sendErrorRes(req, res, HttpStatus.BAD_REQUEST, MESSAGES.MINIMUM_AMOUNT_NOT_REACH);
    } else if (new Date(coupon.expiryDate) < date) {
      return sendErrorRes(req, res, HttpStatus.BAD_REQUEST, MESSAGES.COUPON_EXPIRED);
    } else {
      let couponDiscount = null;

      // Calculate discount based on percentage and check against maxRedeemAmount
      const discountAmount = (cartSubTotal * coupon.discountPercentage) / 100;

      if (discountAmount > coupon.maxRedeemAmount) {
        couponDiscount = coupon.maxRedeemAmount;
      } else {
        couponDiscount = discountAmount;
      }

      sendSuccessRes(req, res, HttpStatus.OK, MESSAGES.COUPON_APPLIED, {
        couponDiscount: couponDiscount,
      });
    }
  } catch (error) {
    next(error);
  }
};

const placeOrder = async (req, res, next) => {
  const userId = req.session.user_id;
  const { selectedOption, addressId, appliedCoupon } = req.validatedBody;
  try {
    // const cart = await CartDB.findOne({ userId: userId })
    //   .populate({
    //     path: "cartItems.productVariantId",
    //     populate: {
    //       path: "productId",
    //       populate: {
    //         path: "categoryId",
    //       },
    //     },
    //   })
    //   .exec();
    const session = await mongoose.startSession();
    session.startTransaction();
    const cart = await CartDB.findOne({ userId }).populate({
      path: "cartItems.productVariantId",
      match: { variantListed: true },
      populate: {
        path: "productId",
        populate: {
          path: "categoryId",
        },
      },
    });

    if (!cart || !cart.cartItems.length) {
      return sendErrorRes(req, res, HttpStatus.BAD_REQUEST, MESSAGES.CART_EMPTY);
    }

    const stock = cart.cartItems.filter((item) => {
      if (!item.productVariantId) return false;
      if (!item.productVariantId.variantListed) return false;
      if (
        !item.productVariantId.sizes.find(
          ({ size, stock }) => item.selectedSize == size && stock >= 0
        )
      )
        return false;
      return true;
    });

    let cartSubTotal = Math.round(
      stock.reduce((acc, curr) => {
        const price = curr.productVariantId.variantPrice;
        return price * curr.quantity + acc;
      }, 0)
    );
    const deliveryCharge = cartSubTotal < 5000 ? 100 : 0;
    let grandTotal = cartSubTotal + deliveryCharge;

    if (cartSubTotal > 1000 && selectedOption == "COD") {
      return sendErrorRes(req, res, HttpStatus.BAD_REQUEST, MESSAGES.COD_NOT_AVAILABLE);
    }
    // Address management

    const address = await AddressDB.findOne({
      userId: userId,
      "addresses._id": addressId,
    });

    if (!address) {
      return sendErrorRes(req, res, HttpStatus.BAD_REQUEST, MESSAGES.ADDRESS_NOT_FOUND);
    }

    const shippingAddress = address.addresses.find((item) => item._id.toString() === addressId);

    // order array item saving
    // const orderItems = stock.map((item) => ({
    //   productId: item.productVariantId.productId._id,
    //   variantId: item.productVariantId._id,
    //   variantName: item.productVariantId.variantName,
    //   variantPrice: item.productVariantId.variantPrice,
    //   quantity: item.quantity,
    //   orderStatus: selectedOption === "Online-Payment" ? "Pending" : "Processing",
    //   offerDiscount: 0,
    //   categoryName: item.productVariantId.productId.categoryId.name,
    // }));

    // let offerDiscount = 0;

    // stock.forEach((item) => {
    //   const originalPrice = parseFloat(item.productVariantId.variantPrice);
    //   let bestDiscount = 0;
    //   if (
    //     item.productVariantId.categoryOffer &&
    //     item.productVariantId.categoryOffer.listed &&
    //     item.productVariantId.categoryOffer.discountPercentage
    //   ) {
    //     const discountPercentage = parseFloat(
    //       item.productVariantId.categoryOffer.discountPercentage
    //     );
    //     bestDiscount = originalPrice * (discountPercentage / 100) * item.quantity;
    //   }

    //   if (
    //     item.productVariantId.productOffer &&
    //     item.productVariantId.productOffer.listed &&
    //     item.productVariantId.productOffer.discountPercentage
    //   ) {
    //     const discountPercentage = parseFloat(
    //       item.productVariantId.productOffer.discountPercentage
    //     );
    //     let discount = originalPrice * (discountPercentage / 100) * item.quantity;
    //     bestDiscount = bestDiscount < discount ? discount : bestDiscount
    //   }

    //   offerDiscount += bestDiscount;
    // });

    let totalOfferDiscount = 0;

    const orderItems = stock.map((item) => {
      const originalPrice = Math.round(Number(item.productVariantId.variantPrice));
      const quantity = item.quantity;

      let bestDiscount = 0;

      if (
        item.productVariantId.categoryOffer?.listed &&
        item.productVariantId.categoryOffer?.discountPercentage
      ) {
        const percentage = Number(item.productVariantId.categoryOffer.discountPercentage);

        bestDiscount = Math.round(originalPrice * (percentage / 100) * quantity);
      }

      if (
        item.productVariantId.productOffer?.listed &&
        item.productVariantId.productOffer?.discountPercentage
      ) {
        const percentage = Number(item.productVariantId.productOffer.discountPercentage);

        const productDiscount = Math.round(originalPrice * (percentage / 100) * quantity);

        bestDiscount = Math.max(bestDiscount, productDiscount);
      }

      totalOfferDiscount += bestDiscount;

      return {
        productId: item.productVariantId.productId._id,
        variantId: item.productVariantId._id,
        variantName: item.productVariantId.variantName,
        variantPrice: originalPrice,
        quantity,
        orderStatus: selectedOption === "Online-Payment" ? "Pending" : "Processing",
        offerDiscount: bestDiscount,
        categoryName: item.productVariantId.productId.categoryId.name,
        selectedSize: item.selectedSize,
      };
    });
    grandTotal -= totalOfferDiscount;
    // coupon finding

    // console.log('orderItems',orderItems);
    let couponDetails = {};
    if (appliedCoupon) {
      const coupon = await CouponDB.findOne({ couponCode: appliedCoupon });

      if (!coupon || !coupon.listed) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ success: false, message: "Coupon is not valid" });
      }

      const discountAmount = Math.round((cartSubTotal * coupon.discountPercentage) / 100);
      const couponDiscount = Math.round(Math.min(discountAmount, coupon.maxRedeemAmount));

      couponDetails = {
        maxRedeemAmount: coupon.maxRedeemAmount,
        discountPercentage: coupon.discountPercentage,
        claimedAmount: couponDiscount,
        couponCode: coupon.couponCode,
        minPurchaseAmount: coupon.minPurchaseAmount,
      };

      grandTotal -= couponDiscount;
    }

    // order saving

    const OrderData = new OrderDB({
      userId: userId,
      orderItems: orderItems,
      paymentMethod: selectedOption,
      subTotal: cartSubTotal,
      deliveryCharge: deliveryCharge,
      grandTotal: Math.round(grandTotal),
      shippingAddress: shippingAddress,
      couponDetails: couponDetails,
      totalOfferDiscount,
    });

    const placedOrder = await OrderData.save();
    const orderId = placedOrder._id;

    if (placedOrder) {
      try {
        for (const element of stock) {
          const updated = await variantDB.findOneAndUpdate(
            {
              _id: element.productVariantId._id,
              sizes: {
                $elemMatch: {
                  size: element.selectedSize,
                  stock: { $gte: element.quantity },
                },
              },
            },
            {
              $inc: { "sizes.$.stock": -element.quantity },
            },
            { session }
          );

          if (!updated) {
            // throw new Error("Insufficient stock");
            return sendErrorRes(req, res, HttpStatus.BAD_REQUEST, MESSAGES.PRODUCT_OUT_OF_STOCK);
          }

          await CartDB.updateOne(
            { userId },
            {
              $pull: {
                cartItems: {
                  productVariantId: element.productVariantId._id,
                },
              },
            },
            { session }
          );
        }

        await session.commitTransaction();
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }
    }

    if (selectedOption == "COD") {
      return sendSuccessRes(req, res, HttpStatus.OK, MESSAGES.ORDER_PLACED, { orderId });
      // res.status(HttpStatus.OK).json({ success: true, message: "Order successfully placed", orderId });
    } else {
      const grandTotal = placedOrder.grandTotal;

      // var instance = new Razorpay({
      //   key_id: process.env.RAZORPAY_KEYID,
      //   key_secret: process.env.RAZORPAY_KEYSECRET,
      // });

      // const order = await instance.orders.create({
      //   amount: grandTotal * 100,
      //   currency: "INR",
      //   receipt: orderId.toString(),
      //   payment_capture: 1,
      // });

      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "inr",
              product_data: {
                name: "Place order",
              },
              unit_amount: grandTotal * 100,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.APP_URL}/orderTracking/?orderId=${placedOrder.id}`,
        cancel_url: `${process.env.APP_URL}/checkout`,
        metadata: {
          app: "cozaStore",
          orderId: placedOrder._id.toString(),
          userId: userId.toString(),
          action: "checkout",
        },
      });
      // res.redirect(HttpStatus.SEE_OTHER, checkoutSession.url)
      sendSuccessRes(req, res, HttpStatus.OK, "Redirecting...", { url: checkoutSession.url });
    }
  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;

    const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEYSECRET);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest("hex");

    //CHECKING PAYMENT IS VERIFIED
    if (digest === razorpay_signature) {
      // UPDATING FEILD
      await OrderDB.findByIdAndUpdate(
        order_id,
        {
          "orderItems.$[].orderStatus": "Processing",
          // razorPayment_id: razorpay_payment_id
        },
        { upsert: true, new: true }
      );

      return res
        .status(HttpStatus.OK)
        .json({ order_id, message: "Payment successful and Order placed" });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: "Failed" });
    }
  } catch (error) {
    next(error);
  }
};

const loadOrderPage = async (req, res, next) => {
  try {
    const limit = 3;
    const page = Math.max(1, parseInt(req.query.page)) || 1;
    const skip = (page - 1) * limit;

    const userId = req.session.user_id;
    const orders = await OrderDB.find({ userId: userId })
      .populate("userId")
      .populate("orderItems.variantId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    if (!orders) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ success: false, message: "No Order data found" });
    }

    const count = await OrderDB.countDocuments({ userId: userId });
    const totalPages = Math.ceil(count / limit);

    res.render("orderPage", { orders, message: undefined, page, totalPages });
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const { orderId, variantId } = req.validatedBody;

    const order = await OrderDB.findById(orderId);
    if (!order) {
      return sendErrorRes(req, res, HttpStatus.NOT_FOUND, MESSAGES.ORDER_NOT_FOUND);
    }

    const orderItem = await OrderDB.findOne(
      { _id: orderId, "orderItems._id": variantId },
      { "orderItems.$": 1 }
    );

    if (!orderItem) {
      return sendErrorRes(req, res, HttpStatus.NOT_FOUND, MESSAGES.PRODUCT_NOT_FOUND);
    }
    console.log("orderItem", orderItem);

    const orderData = orderItem.orderItems[0];
    // const variantId = orderData.variantId;
    const variantQuantity = orderData.quantity;
    const originalPrice = orderData.variantPrice;
    const offerDiscount = orderData.offerDiscount;
    let totalOfferDiscount = order.totalOfferDiscount - offerDiscount;

    // Update variant stock
    await variantDB.findOneAndUpdate(
      {
        _id: variantId,
        sizes: {
          $elemMatch: {
            size: orderData.selectedSize,
            // stock: { $gte: element.quantity },
          },
        },
      },
      {
        $inc: { "sizes.$.stock": variantQuantity },
      },
      { new: true }
    );

    const totalVariantPrice = originalPrice * variantQuantity;
    const totalVariantPriceAfterDiscount = totalVariantPrice - offerDiscount;
    // Update order totals: Subtotal without considering offer discount
    const newSubTotal = await OrderDB.findOneAndUpdate(
      { _id: orderId, "orderItems._id": variantId },
      {
        $inc: {
          subTotal: -totalVariantPrice,
        },
      },
      { new: true }
    );

    let deliveryCharge = newSubTotal.subTotal > 5000 ? 0 : 100;
    let dCount = newSubTotal.orderItems.filter((item) => item.orderStatus !== "Cancelled").length;

    if (dCount > 1) {
      deliveryCharge = 0;
    }

    // const newGrandTotal = parseInt(newSubTotal.subTotal + deliveryCharge - totalOfferDiscount);
    const newGrandTotal = Math.floor(newSubTotal.subTotal + deliveryCharge - offerDiscount);
    if (newGrandTotal == 0) {
      totalOfferDiscount = 0;
    }

    await OrderDB.findOneAndUpdate(
      { _id: orderId },
      {
        $set: {
          grandTotal: newGrandTotal,
          deliveryCharge: deliveryCharge,
          totalOfferDiscount: totalOfferDiscount,
        },
      }
    );

    const appliedCoupon = await OrderDB.findOne(
      { _id: orderId, couponDetails: { $exists: true } },
      { couponDetails: 1, _id: 0 }
    );

    if (appliedCoupon && appliedCoupon.couponDetails) {
      const minPurchaseAmount = appliedCoupon.couponDetails.minPurchaseAmount;

      if (minPurchaseAmount > newSubTotal.subTotal) {
        const grandTotal = order.grandTotal;

        await OrderDB.findByIdAndUpdate(
          orderId,
          {
            $unset: { couponDetails: "" },
          },
          { new: true }
        );

        if (order.paymentMethod == "Online-Payment") {
          const cancelOrder = await OrderDB.updateMany(
            { _id: orderId },
            {
              $set: {
                grandTotal: 0,
                deliveryCharge: 0,
                "orderItems.$[elem].orderStatus": "Cancelled",
                "orderItems.$[elem].cancelledOrRefunded": true,
              },
            },
            {
              arrayFilters: [{ "elem._id": { $exists: true } }],
            }
          );

          if (cancelOrder) {
            await WalletDB.findOneAndUpdate(
              { userId: userId },
              {
                $push: {
                  transactions: {
                    amount: grandTotal,
                    transactionMethod: "Cancelled",
                  },
                },
                $inc: { balance: grandTotal },
              },
              { upsert: true, new: true }
            );

            return sendSuccessRes(req, res, HttpStatus.OK, MESSAGES.ORDER_CANCELLED);
          } else {
            return sendErrorRes(req, res, HttpStatus.OK, "failed to cancel order");
          }
        } else {
          await OrderDB.findOneAndUpdate(
            { _id: orderId, "orderItems._id": variantId },
            {
              $set: {
                "orderItems.$.cancelledOrRefunded": true,
                "orderItems.$.orderStatus": "Cancelled",
              },
            },
            { new: true }
          );
          return sendSuccessRes(req, res, HttpStatus.OK, MESSAGES.ORDER_CANCELLED);
        }
      } else {
        const grandTotal = newGrandTotal;

        const productCount = await OrderDB.findOne({ _id: orderId }, { orderItems: 1 });

        const nonCancelledItemsCount = productCount.orderItems.filter(
          (item) => !item.cancelledOrRefunded
        ).length;

        const claimedAmount =
          (order.subTotal * appliedCoupon.couponDetails.discountPercentage) / 100;
        const couponDiscountPerItem = claimedAmount / nonCancelledItemsCount;

        const discountAmount =
          (newSubTotal.subTotal * appliedCoupon.couponDetails.discountPercentage) / 100;
        const couponDiscount = Math.min(
          discountAmount,
          appliedCoupon.couponDetails.maxDiscountAmount ||
            appliedCoupon.couponDetails.maxRedeemAmount
        );
        const finalGrandTotal = parseInt(grandTotal - couponDiscount);
        const amountToRefund = parseInt(
          totalVariantPriceAfterDiscount - couponDiscountPerItem + parseInt(deliveryCharge)
        );

        await OrderDB.findByIdAndUpdate(
          orderId,
          {
            $set: {
              "couponDetails.claimedAmount": couponDiscount,
            },
          },
          { new: true }
        );

        if (order.paymentMethod == "Online-Payment") {
          await OrderDB.findByIdAndUpdate(orderId, {
            $set: {
              subTotal: newSubTotal.subTotal,
              grandTotal: finalGrandTotal,
              deliveryCharge: deliveryCharge,
            },
          });

          await OrderDB.findOneAndUpdate(
            { _id: orderId, "orderItems._id": variantId },
            {
              $set: {
                "orderItems.$.orderStatus": "Cancelled",
                "orderItems.$.cancelledOrRefunded": true,
              },
            },
            { new: true }
          );

          const refund = await WalletDB.findOneAndUpdate(
            { userId: userId },
            {
              $push: {
                transactions: {
                  amount: amountToRefund,
                  transactionMethod: "Cancelled",
                },
              },
              $inc: { balance: amountToRefund },
            },
            { upsert: true, new: true }
          );

          if (refund) {
            return res.status(HttpStatus.OK).json({
              success: true,
              message: "Order cancelled successfully and amount refunded",
            });
          }
        } else {
          await OrderDB.findOneAndUpdate(
            { _id: orderId, "orderItems._id": variantId },
            {
              $set: {
                "orderItems.$.cancelledOrRefunded": true,
                "orderItems.$.orderStatus": "Cancelled",
              },
            },
            { new: true }
          );

          return res.status(HttpStatus.OK).json({ message: "Order cancelled successfully" });
        }
      }
    } else {
      await OrderDB.findOneAndUpdate(
        { _id: orderId, "orderItems._id": variantId },
        {
          $set: {
            "orderItems.$.cancelledOrRefunded": true,
            "orderItems.$.orderStatus": "Cancelled",
          },
        },
        { new: true }
      );

      if (order.paymentMethod == "Online-Payment") {
        const refund = await WalletDB.findOneAndUpdate(
          { userId: userId },
          {
            $push: {
              transactions: {
                amount: totalVariantPriceAfterDiscount + parseInt(deliveryCharge),
                transactionMethod: "Cancelled",
              },
            },
            $inc: { balance: totalVariantPriceAfterDiscount + +parseInt(deliveryCharge) },
          },
          { upsert: true, new: true }
        );

        if (refund) {
          return sendSuccessRes(req, res, HttpStatus.OK, MESSAGES.ORDER_CANCELLED_AND_REFUNDED);
        }
      } else {
        return sendSuccessRes(req, res, HttpStatus.OK, MESSAGES.ORDER_CANCELLED);
      }
    }
  } catch (error) {
    next(error);
  }
};

const loadOrderTrackingPage = async (req, res, next) => {
  try {
    const orderId = req.query.orderId;

    if (!isValidObjectId(orderId)) {
      return res.redirect("/404error");
    }

    if (!orderId) {
      return res.redirect("/404error");
    }

    const order = await OrderDB.findById(orderId)
      .populate("userId")
      .populate("orderItems.variantId")
      .sort({ createdAt: -1 });

    if (!order) {
      // return res
      //   .status(404)
      //   .json({ message: 'Order not found', success: false })
      return res.redirect("/404error");
    }

    return res.render("orderTracking", { message: undefined, order });
  } catch (error) {
    next(error);
  }
};

const loadWalletPage = async (req, res, next) => {
  try {
    const limit = 5;
    const page = Math.max(1, parseInt(req.query.page)) || 1;
    const skip = (page - 1) * limit;

    const userId = req.session.user_id;
    const wallet = await WalletDB.findOne({ userId: userId })
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit);

    const count = await WalletDB.countDocuments({ userId: userId });
    const totalPages = Math.ceil(count / limit);

    res.render("wallet", { wallet, message: undefined, page, totalPages });
  } catch (error) {
    next(error);
  }
};

const loadWishList = async (req, res, next) => {
  try {
    const limit = 5;
    const page = Math.max(1, parseInt(req.query.page)) || 1;
    const skip = (page - 1) * limit;

    const userId = req.session.user_id;
    const wishlist = await WishlistDB.findOne({ userId: userId })
      .populate("variantItems.variantId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const count = await WishlistDB.countDocuments({ userId: userId });
    const totalPages = Math.ceil(count / limit);

    res.render("wishlist", {
      wishlist,
      message: undefined,
      page,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

const addToWishlist = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const { variantId, selectedSize } = req.validatedBody;
    if (!userId) {
      return sendErrorRes(req, res, HttpStatus.BAD_REQUEST, MESSAGES.USER_NOT_FOUND);
    }
    const variant = await variantDB.findById(variantId);
    if (!variant) {
      return sendErrorRes(req, res, HttpStatus.BAD_REQUEST, MESSAGES.PRODUCT_NOT_FOUND);
    }

    const stockAndSize = variant.sizes.find(({ size }) => size === selectedSize);

    if (!stockAndSize) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ success: false, message: MESSAGES.VARIANT_SIZE_NOT_FOUNT });
    }

    const updateData = {
      variantId,
      selectedSize,
    };

    const existingUser = await WishlistDB.findOne({ userId: userId });
    if (existingUser) {
      const existingItem = existingUser.variantItems.find(
        (item) => item.variantId.toString() === variantId && item.selectedSize === selectedSize
      );

      if (existingItem) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ success: false, message: "Item already exists in wishlist" });
      } else {
        existingUser.variantItems.push(updateData);
        await existingUser.save();
      }
    } else {
      const newWishlist = new WishlistDB({
        userId: userId,
        variantItems: [updateData],
      });

      await newWishlist.save();
    }

    return res.status(HttpStatus.OK).json({
      success: true,
      message: "Product added to wishlist successfully ",
    });
  } catch (error) {
    next(error);
  }
};

const removeFromWishlist = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const { variantId, selectedSize } = req.validatedBody;

    const updateData = await WishlistDB.findOneAndUpdate(
      { userId: userId },
      {
        $pull: {
          variantItems: { variantId: variantId, selectedSize: selectedSize },
        },
      },
      { new: true }
    );

    if (updateData) {
      return res
        .status(HttpStatus.OK)
        .json({ success: true, message: "Item removed successfully " });
    } else {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ success: false, message: "Product not found" });
    }
  } catch (error) {
    next(error);
  }
};

const requestReturn = async (req, res, next) => {
  try {
    const { orderId, variantId, returnReason } = req.validatedBody;
    const order = await OrderDB.findOneAndUpdate(
      { _id: orderId, "orderItems._id": variantId },
      {
        $set: {
          "orderItems.$.returnReason": returnReason,
          "orderItems.$.orderStatus": "Return requested",
        },
      }
    );
    if (!order) {
      return sendErrorRes(req, res, HttpStatus.BAD_REQUEST, MESSAGES.ORDER_NOT_FOUND);
    }
    return sendSuccessRes(req, res, HttpStatus.OK, "Return requested successfully");
  } catch (error) {
    next(error);
  }
};

const rePayment = async (req, res, next) => {
  try {
    const { id: orderId } = req.validatedBody;
    const userId = req.session.user_id;
    const placedOrder = await OrderDB.findById(orderId);
    if (!orderId || !placedOrder) {
      return sendErrorRes(req, res, HttpStatus.NOT_FOUND, MESSAGES.ORDER_NOT_FOUND);
    }

    const grandTotal = placedOrder.grandTotal;

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: "Place order",
            },
            unit_amount: grandTotal * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.APP_URL}/orderTracking/?orderId=${placedOrder.id}`,
      cancel_url: `${process.env.APP_URL}/checkout`,
      metadata: {
        app: "cozaStore",
        orderId: placedOrder._id.toString(),
        userId: userId.toString(),
        action: "re-payment",
      },
    });

    sendSuccessRes(req, res, HttpStatus.OK, "Redirecting...", { url: checkoutSession.url });
  } catch (error) {
    next(error);
  }
};

const downloadInvoice = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const orderId = req.query.orderId;

    if (!isValidObjectId(orderId)) {
      return res.redirect("/orders");
    }

    const orders = await OrderDB.findOne({
      _id: orderId,
      userId: userId,
      orderItems: {
        $elemMatch: { cancelledOrRefunded: false },
      },
    });

    if (!orders) {
      return res.redirect("/404error");
    }

    const orderCountResult = await OrderDB.aggregate([
      {
        $match: {
          _id: new ObjectId(orderId), // Convert string to ObjectId
          userId: new ObjectId(userId), // Convert string to ObjectId
        },
      },
      { $unwind: "$orderItems" },
      {
        $match: {
          "orderItems.cancelledOrRefunded": false,
        },
      },
      { $count: "length" },
    ]);

    let completedOrder = await OrderDB.aggregate([
      {
        $match: {
          _id: new ObjectId(orderId), // Convert string to ObjectId
          userId: new ObjectId(userId), // Convert string to ObjectId
        },
      },
      { $unwind: "$orderItems" },
      {
        $match: {
          "orderItems.orderStatus": "Delivered",
        },
      },
      { $project: { orderItems: 1 } },
    ]);

    const countValue = orderCountResult[0].length;

    let subTotal = 0;
    let totalOfferDiscount = 0;

    let claimedAmount = orders.couponDetails.claimedAmount || 0;
    let couponAppliedForEachProduct = claimedAmount / countValue;
    let couponDis = couponAppliedForEachProduct * completedOrder.length;

    for (const order of completedOrder) {
      const item = order.orderItems;
      const itemSubtotal = item.quantity * item.variantPrice;
      subTotal += itemSubtotal;
      totalOfferDiscount += item.offerDiscount;
    }
    let grandTotal = subTotal - totalOfferDiscount - couponDis;

    let deliveryCharge = orders.deliveryCharge == 100 ? orders.deliveryCharge : 0;

    grandTotal += parseInt(deliveryCharge);

    const currentDate = new Date();
    return res.status(HttpStatus.OK).render("invoicePage", {
      orders,
      completedOrder,
      currentDate,
      subTotal,
      totalOfferDiscount,
      couponAppliedForEachProduct,
      couponDis,
      grandTotal,
    });
  } catch (error) {
    next(error);
  }
};

const webhook = async (req, res, _next) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.WEBHOOK_SECRET_KEY);
  } catch (err) {
    console.error(" Stripe signature verification failed:", err.message);
    return res.status(HttpStatus.BAD_REQUEST).send(`Webhook Error: ${err.message}`);
  }

  console.log("event type:", event.type);

  res.json({ received: true });

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.log("checkout.session.completed test passed");

      if (
        session.metadata &&
        (session.metadata.action === "checkout" || session.metadata.action === "re-payment")
      ) {
        const orderId = session.metadata.orderId;

        await OrderDB.findByIdAndUpdate(orderId, {
          $set: {
            "orderItems.$[].orderStatus": "Processing",
          },
        });
      }
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
  }
};

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
  downloadInvoice,
  webhook,
};
