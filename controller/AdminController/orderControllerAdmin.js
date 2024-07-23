const User = require('../../model/userModel')
const CategoryDB = require('../../model/categoryModel')
const productDB = require('../../model/productModel')
const variantDB = require('../../model/variantModel')
const AddressDB = require('../../model/addressModal')
const CartDB = require('../../model/cartModel')
const OrderDB = require('../../model/orderModal')
const WalletDB = require('../../model/walletModel')
const PDFDocument = require('pdfkit');

const fs = require('fs');
const path = require('path');

const loadOrderPage = async (req, res,next) => {
  try {
    const limit = 8;
    const page = Math.max(1, parseInt(req.query.page)) || 1;
    const skip = (page - 1) * limit;

    const orders = await OrderDB.find()
      .populate('userId')
      .populate('orderItems.variantId')
      .sort({ createdAt: -1 }).skip(skip).limit(limit)
     
     const Count = await OrderDB.countDocuments();
    const totalPages = Math.ceil(Count / limit);

    res.render('orderPageAdmin', { orders, message: undefined , totalPages , page })
  } catch (error) {
    next(error)
  }
}



const loadOrderDetailsPage = async (req, res,next) => {
  try {
    const orderId = req.params.orderId
    if (!orderId) {
      return res
        .status(400)
        .json({ success: false, message: 'Order not found' })
    }

    const order = await OrderDB.findById(orderId)
      .populate('userId')
      .populate('orderItems.variantId')
    if (!order) {
      return res
        .status(400)
        .json({ success: false, message: 'Order not found' })
    }

    const validStatusTransitions = {
      Pending: ['Processing', 'Cancelled'],
      Processing: ['Shipped', 'Cancelled'],
      Shipped: ['Delivered'],
      Delivered: [],
      'Return requested': ['Return approved', 'Return Rejected'],
      'Return approved': ['Refunded'],
      'Return Rejected': [],
      Cancelled: [],
      Returned: [],
     
      Refunded: []
    }

    res.render('orderDetailsAdmin', {
      order,
      validStatusTransitions,
      message: undefined
    })
  } catch (error) {
   next(error)
  }
}



const changeOrderStatus = async (req, res,next) => {
  try {
    const orderId = req.params.orderId;
    const { status, variantId } = req.body;

    if (!orderId || !status || !variantId) {
      return res.status(400).json({ success: false, message: 'Order not found' });
    }

    const order = await OrderDB.findOne({ _id: orderId });
    if (!order) {
      return res.status(400).json({ success: false, message: 'Order not found' });
    }

    const userId = order.userId;
    const variantItem = order.orderItems.find(item => item.variantId.equals(variantId));
    if (!variantItem) {
      return res.status(400).json({ success: false, message: 'Variant not found in order' });
    }

    const variantPrice = parseFloat(variantItem.variantPrice);
    const variantQuantity = parseInt(variantItem.quantity, 10);
    const offerDiscount = parseFloat(variantItem.offerDiscount) || 0;

    if (status === 'Cancelled') {
      const totalVariantPrice = variantQuantity * variantPrice;
      const amountToRefund = totalVariantPrice - offerDiscount;
      const totalOfferDiscount = order.TotalOfferDiscount - offerDiscount;

      const updatePromises = order.orderItems.map(async item => {
        await variantDB.findByIdAndUpdate(item.variantId, {
          $inc: { variantStock: item.quantity }
        });
      });
      await Promise.all(updatePromises);

      const newSubTotal = await OrderDB.findOneAndUpdate(
        { _id: orderId, 'orderItems.variantId': variantId },
        { $inc: { subTotal: -totalVariantPrice } },
        { new: true }
      );

      let deliveryCharge = newSubTotal.subTotal > 5000 ? 0 : 100;
      if (newSubTotal.subTotal === 0) {
        deliveryCharge = 0;
      }

      const newGrandTotal = newSubTotal.subTotal + deliveryCharge - totalOfferDiscount;

      await OrderDB.findOneAndUpdate(
        { _id: orderId },
        {
          $set: {
            grandTotal: newGrandTotal,
            deliveryCharge: deliveryCharge,
            TotalOfferDiscount: totalOfferDiscount
          }
        }
      );

      const appliedCoupon = await OrderDB.findOne(
        { _id: orderId, couponDetails: { $exists: true } },
        { couponDetails: 1, _id: 0 }
      );

      if (appliedCoupon && appliedCoupon.couponDetails) {
        const minPurchaseAmount = appliedCoupon.couponDetails.minPurchaseAmount;
        const claimedCouponAmount = appliedCoupon.couponDetails.claimedAmount;

        if (minPurchaseAmount > newSubTotal.subTotal) {
          const grandTotal = order.grandTotal;

          await OrderDB.findByIdAndUpdate(
            orderId,
            { $unset: { couponDetails: '' } },
            { new: true }
          );

          if (order.paymentMethod === 'Online-Payment') {
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
              { arrayFilters: [{ 'elem._id': { $exists: true } }] }
            );

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
              );

              return res.status(200).json({
                success: true,
                message: 'Order cancelled successfully'
              });
            } else {
              return res.status(400).json({
                success: false,
                message: 'Failed to cancel order'
              });
            }
          } else {
            await OrderDB.findOneAndUpdate(
              { _id: orderId, 'orderItems.variantId': variantId },
              {
                $set: {
                  'orderItems.$.cancelledOrRefunded': true,
                  'orderItems.$.orderStatus': 'Cancelled'
                }
              },
              { new: true }
            );

            return res.status(200).json({ success: true, message: 'Order cancelled successfully' });
          }
        } else {
          const discountAmount = (newSubTotal.subTotal * appliedCoupon.couponDetails.discountPercentage) / 100;
          const couponDiscount = Math.min(discountAmount, appliedCoupon.couponDetails.maxDiscountAmount || appliedCoupon.couponDetails.maxRedeemAmount);
          const finalGrandTotal = newGrandTotal - couponDiscount - totalOfferDiscount;

          const productCount = await OrderDB.findOne(
            { _id: orderId },
            { orderItems: 1 }
          );

          const nonCancelledItemsCount = productCount.orderItems.filter(item => !item.cancelledOrRefunded).length;

          const claimedAmount = (order.subTotal * appliedCoupon.couponDetails.discountPercentage) / 100;
          const couponDiscountPerItem = claimedAmount / nonCancelledItemsCount;
          const amountToRefundAfterCoupon = parseInt(amountToRefund - couponDiscountPerItem);

          await OrderDB.findByIdAndUpdate(
            orderId,
            { $set: { 'couponDetails.claimedAmount': couponDiscount } },
            { new: true }
          );

          if (order.paymentMethod === 'Online-Payment') {
            await OrderDB.findByIdAndUpdate(orderId, {
              $set: {
                subTotal: newSubTotal.subTotal,
                grandTotal: finalGrandTotal,
                deliveryCharge: deliveryCharge,
                TotalOfferDiscount: totalOfferDiscount
              }
            });

            await OrderDB.findOneAndUpdate(
              { _id: orderId, 'orderItems.variantId': variantId },
              {
                $set: {
                  'orderItems.$.orderStatus': 'Cancelled',
                  'orderItems.$.cancelledOrRefunded': true
                }
              },
              { new: true }
            );

            const refund = await WalletDB.findOneAndUpdate(
              { userId: userId },
              {
                $push: {
                  transactions: {
                    amount: amountToRefundAfterCoupon,
                    transactionMethod: 'Cancelled'
                  }
                },
                $inc: { balance: amountToRefundAfterCoupon }
              },
              { upsert: true, new: true }
            );

            if (refund) {
              return res.status(200).json({
                success: true,
                message: 'Order cancelled successfully and amount refunded'
              });
            }
          } else {
            await OrderDB.findOneAndUpdate(
              { _id: orderId, 'orderItems.variantId': variantId },
              {
                $set: {
                  'orderItems.$.orderStatus': 'Cancelled',
                  'orderItems.$.cancelledOrRefunded': true
                }
              },
              { new: true }
            );

            return res.status(200).json({ success: true, message: 'Order cancelled successfully' });
          }
        }
      } else {
        await OrderDB.findOneAndUpdate(
          { _id: orderId, 'orderItems.variantId': variantId },
          {
            $set: {
              'orderItems.$.cancelledOrRefunded': true,
              'orderItems.$.orderStatus': 'Cancelled'
            }
          },
          { new: true }
        );

        if (order.paymentMethod === 'Online-Payment') {
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
          );

          if (refund) {
            return res.status(200).json({
              success: true,
              message: 'Order cancelled successfully and amount refunded'
            });
          }
        } else {
          return res.status(200).json({
            success: true,
            message: 'Order cancelled successfully'
          });
        }
      }
    } else if (status === 'Delivered') {
      await OrderDB.findOneAndUpdate(
        { _id: orderId, 'orderItems.variantId': variantId },
        { $set: { 'orderItems.$.orderStatus': status, deliveryDate: Date.now() } }
      );

      return res.status(200).json({
        success: true,
        message: 'Order status updated successfully'
      });
    } else if (status === 'Refunded') {
      const totalVariantPrice = variantQuantity * variantPrice;
      const newSubTotal = await OrderDB.findOneAndUpdate(
        { _id: orderId, 'orderItems.variantId': variantId },
        { $inc: { subTotal: -totalVariantPrice } },
        { new: true }
      );

      let deliveryCharge = newSubTotal.subTotal > 5000 ? 0 : 100;
      if (newSubTotal.subTotal === 0) {
        deliveryCharge = 0;
      }

      const totalOfferDiscount = order.TotalOfferDiscount - offerDiscount;

      await variantDB.findOneAndUpdate({ _id: variantId }, {
        $inc: { variantStock: variantQuantity }
      });

      const appliedCoupon = await OrderDB.findOne(
        { _id: orderId, couponDetails: { $exists: true } }
      );

      if (appliedCoupon) {
        const nonCancelledItems = order.orderItems.filter(item => !item.cancelledOrRefunded);
        const orderCount = nonCancelledItems.length;
        const productDiscount = appliedCoupon.couponDetails.claimedAmount / orderCount;
        const amountToRefund = parseInt(totalVariantPrice - productDiscount - offerDiscount);

        const finalGrandTotal = newSubTotal.subTotal + deliveryCharge - amountToRefund;

        await OrderDB.findOneAndUpdate(
          { _id: orderId, 'orderItems.variantId': variantId },
          {
            $set: {
              'orderItems.$.orderStatus': 'Refunded',
              'orderItems.$.cancelledOrRefunded': true
            }
          },
          { new: true }
        );

        await OrderDB.findByIdAndUpdate(orderId, {
          $set: {
            subTotal: newSubTotal.subTotal,
            grandTotal: finalGrandTotal,
            deliveryCharge: deliveryCharge,
            TotalOfferDiscount: totalOfferDiscount
          }
        });

        const refund = await WalletDB.findOneAndUpdate(
          { userId: userId },
          {
            $push: {
              transactions: {
                amount: amountToRefund,
                transactionMethod: 'Refund'
              }
            },
            $inc: { balance: amountToRefund }
          },
          { upsert: true, new: true }
        );

        if (refund) {
          return res.status(200).json({ success: true, message: 'Refunded successfully' });
        } else {
          return res.status(400).json({ success: false, message: 'Refund failed' });
        }
      } else {
        const amountToRefund = totalVariantPrice - offerDiscount;
        const newGrandTotal = newSubTotal.subTotal + deliveryCharge - amountToRefund;

        await OrderDB.findOneAndUpdate(
          { _id: orderId, 'orderItems.variantId': variantId },
          {
            $set: {
              'orderItems.$.orderStatus': 'Refunded',
              'orderItems.$.cancelledOrRefunded': true
            }
          },
          { new: true }
        );

        await OrderDB.findByIdAndUpdate(orderId, {
          $set: {
            subTotal: newSubTotal.subTotal,
            grandTotal: newGrandTotal,
            deliveryCharge: deliveryCharge,
            TotalOfferDiscount: totalOfferDiscount
          }
        });

        const refund = await WalletDB.findOneAndUpdate(
          { userId: userId },
          {
            $push: {
              transactions: {
                amount: amountToRefund,
                transactionMethod: 'Refund'
              }
            },
            $inc: { balance: amountToRefund }
          },
          { upsert: true, new: true }
        );

        if (refund) {
          return res.status(200).json({ success: true, message: 'Refunded successfully' });
        } else {
          return res.status(400).json({ success: false, message: 'Refund failed' });
        }
      }
    } else {
      await OrderDB.findOneAndUpdate(
        { _id: orderId, 'orderItems.variantId': variantId },
        { $set: { 'orderItems.$.orderStatus': status } }
      );

      return res.status(200).json({
        success: true,
        message: 'Order status updated successfully'
      });
    }
  } catch (error) {
    next(error)
  }
};


// const loadSalesReport = async (req, res) => {
//   try {
   

//     const filter = req.query.filter || 'All';
//     const startDate = req.query.startDate;
//     const endDate = req.query.endDate;

//     let matchCondition = { "orderItems.orderStatus": "Delivered" };

//     if (filter === 'daily') {
//       const today = new Date();
//       matchCondition.deliveryDate = {
//         $gte: new Date(today.setHours(0, 0, 0, 0)),
//         $lt: new Date(today.setHours(23, 59, 59, 999))
//       };
//     } else if (filter === 'weekly') {
//       const today = new Date();
//       const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
//       const lastDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
//       matchCondition.deliveryDate = {
//         $gte: new Date(firstDayOfWeek.setHours(0, 0, 0, 0)),
//         $lt: new Date(lastDayOfWeek.setHours(23, 59, 59, 999))
//       };
//     } else if (filter === 'yearly') {
//       const thisYear = new Date().getFullYear();
//       matchCondition.deliveryDate = {
//         $gte: new Date(thisYear, 0, 1),
//         $lt: new Date(thisYear, 11, 31, 23, 59, 59, 999)
//       };
//     } else if (filter === 'custom' && startDate && endDate) {
//       matchCondition.deliveryDate = {
//         $gte: new Date(startDate),
//         $lt: new Date(new Date(endDate).setHours(23, 59, 59, 999))
//       };
//     }

//     let completedOrder = await OrderDB.aggregate([
//       { $unwind: "$orderItems" },
//       { $match: matchCondition },
//       {
//         $project: {
//           _id: 1,
//           userId: 1,
//           orderDate: 1,
//           deliveryDate: 1,
//           paymentMethod: 1,
//           subTotal: 1,
//           grandTotal: 1,
//           deliveryCharge: 1,
//           couponDetails: 1,
//           deliveredItem: "$orderItems",
//           shippingAddress: 1,
//           offerDiscount: "$orderItems.offerDiscount"
//         }
//       }
//     ]);

//     // Calculate total count and total amount
//     let totalCount = completedOrder.length;
//     let totalAmount = 0;
    
//     completedOrder.forEach(order => {
//       let itemTotal = order.deliveredItem.variantPrice - (order.deliveredItem.offerDiscount || 0);
//       // let couponDiscount = (order.couponDetails?.claimedAmount || 0) / completedOrder.length;
//       // totalAmount += (itemTotal - couponDiscount);
//       totalAmount += itemTotal
//     });

//     if (req.xhr || req.headers.accept.indexOf('json') > -1) {
//       // console.log('Sending response as JSON');
//       return res.json({ completedOrder, totalCount, totalAmount });
//     } else {
   
//       res.render('salesReport', {
//         completedOrder,
//         totalCount,
//         totalAmount,
//         message: undefined
//       });
//     }
//   } catch (error) {
//     console.log('err in loadSalesReport', error);
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// };



const loadSalesReport = async (req, res,next) => { 
  try {
    
    const limit = 10;
    const page = Math.max(1, parseInt(req.query.page)) || 1;
    const skip = (page - 1) * limit;

    const filter = req.query.filter || 'All';
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    let matchCondition = { "orderItems.orderStatus": "Delivered" };

    if (filter === 'daily') {
      const today = new Date();
      matchCondition.deliveryDate = {
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lt: new Date(today.setHours(23, 59, 59, 999))
      };
    } else if (filter === 'weekly') {
      const today = new Date();
      const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
      const lastDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
      matchCondition.deliveryDate = {
        $gte: new Date(firstDayOfWeek.setHours(0, 0, 0, 0)),
        $lt: new Date(lastDayOfWeek.setHours(23, 59, 59, 999))
      };
    } else if (filter === 'yearly') {
      const thisYear = new Date().getFullYear();
      matchCondition.deliveryDate = {
        $gte: new Date(thisYear, 0, 1),
        $lt: new Date(thisYear, 11, 31, 23, 59, 59, 999)
      };
    } else if (filter === 'custom' && startDate && endDate) {
      matchCondition.deliveryDate = {
        $gte: new Date(startDate),
        $lt: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }

    let completedOrder = await OrderDB.aggregate([
      { $unwind: "$orderItems" },
      { $match: matchCondition },
      {
        $project: {
          _id: 1,
          userId: 1,
          orderDate: 1,
          deliveryDate: 1,
          paymentMethod: 1,
          subTotal: 1,
          grandTotal: 1,
          deliveryCharge: 1,
          couponDetails: 1,
          deliveredItem: "$orderItems",
          shippingAddress: 1,
          offerDiscount: "$orderItems.offerDiscount"
        }
      },
      {$skip:skip},
      {$limit:limit}
    ])

    
    let count = await OrderDB.aggregate([
      { $unwind: "$orderItems" },
      { $match: matchCondition },
      {
        $project: {
          _id: 1,
          userId: 1,
          orderDate: 1,
          deliveryDate: 1,
          paymentMethod: 1,
          subTotal: 1,
          grandTotal: 1,
          deliveryCharge: 1,
          couponDetails: 1,
          deliveredItem: "$orderItems",
          shippingAddress: 1,
          offerDiscount: "$orderItems.offerDiscount"
        }
      },
      {$group:{_id:'$id', count :{$sum:1}}}
    ])

   const orderCount = Array.isArray(count) && count.length === 0 ? 0 : count[0]?.count || 0
  
    const totalPages = Math.ceil(orderCount / limit);



    // Calculate total count and total amount
    let totalCount = completedOrder.length;
    let totalAmount = 0;
    
    completedOrder.forEach(order => {
      let itemTotal = order.deliveredItem.variantPrice - (order.deliveredItem.offerDiscount || 0);
    
      totalAmount += itemTotal
    });

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
   
      return res.json({ completedOrder, totalCount, totalAmount });
    } else {
   
      res.render('salesReport', {
        completedOrder,
        totalCount,
        totalAmount,
        totalPages,
        page,
        message: undefined
      });
    }
  } catch (error) {
    next(error)
  }
};



module.exports = {
  loadOrderPage,
  loadOrderDetailsPage, 
  changeOrderStatus,
  loadSalesReport,
 
}
