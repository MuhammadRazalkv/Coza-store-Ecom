const { isValidObjectId } = require("mongoose");
const MESSAGES = require("../../constants/messages");
const HttpStatus = require("../../constants/statusCode");
const CouponDB = require("../../model/couponModal");
const sendErrorRes = require("../../utils/sendJsonError");
const sendSuccessRes = require("../../utils/sendSuccessRes");

const loadCouponPage = async (req, res, next) => {
  try {
    const coupons = await CouponDB.find().sort({ createdAt: -1 });
    res.render("couponsManagement", { coupons });
  } catch (error) {
    next(error);
  }
};

const loadAddCoupon = async (req, res, next) => {
  try {
    res.render("addCoupon");
  } catch (error) {
    next(error);
  }
};

const addCoupon = async (req, res, next) => {
  try {
    const {
      couponName,
      couponCode,
      minimumPurchaseAmount,
      discountPercentage,
      maxRedeemAmount,
      expiryDate,
    } = req.validatedBody;

    const regexName = new RegExp(couponName, "i");
    const regexCode = new RegExp(couponCode, "i");

    const existingCoupon = await CouponDB.findOne({
      $or: [{ couponName: regexName }, { couponCode: regexCode }],
    });

    if (existingCoupon) {
      return sendErrorRes(req, res, HttpStatus.BAD_REQUEST, MESSAGES.DUPLICATE_COUPON);
    }
    const newCoupon = new CouponDB({
      couponName: couponName,
      couponCode: couponCode,
      minPurchaseAmount: parseInt(minimumPurchaseAmount),
      maxRedeemAmount: parseInt(maxRedeemAmount),
      discountPercentage: parseInt(discountPercentage),
      expiryDate: expiryDate,
    });

    await newCoupon.save();
    sendSuccessRes(req, res, HttpStatus.CREATED, MESSAGES.COUPON_ADDED);
  } catch (error) {
    next(error);
  }
};

const loadEditCoupon = async (req, res, next) => {
  try {
    const couponId = req.query.couponId;
    const coupon = await CouponDB.findById(couponId);
    if (!isValidObjectId(couponId) || !coupon) {
      return res.redirect("/couponList");
    }
    res.render("editCoupon", { coupon });
  } catch (error) {
    next(error);
  }
};

const editCoupon = async (req, res, next) => {
  try {
    const {
      couponId,
      couponName,
      couponCode,
      minimumPurchaseAmount,
      discountPercentage,
      maxRedeemAmount,
      expiryDate,
    } = req.validatedBody;

    const existingCoupon = await CouponDB.findById(couponId);

    if (!existingCoupon) {
      return sendErrorRes(req, res, HttpStatus.NOT_FOUND, MESSAGES.COUPON_NOT_FOUND);
    }
    const regexName = new RegExp(couponName, "i");
    const regexCode = new RegExp(couponCode, "i");

    // Check if the new coupon name or code already exists for another coupon
    const duplicateCoupon = await CouponDB.findOne({
      $or: [{ couponName: regexName }, { couponCode: regexCode }],
      _id: { $ne: couponId },
    });

    if (duplicateCoupon) {
      return sendErrorRes(req, res, HttpStatus.BAD_REQUEST, MESSAGES.DUPLICATE_COUPON);
    }
    await CouponDB.findByIdAndUpdate(
      couponId,
      {
        $set: {
          couponName: couponName,
          couponCode: couponCode,
          discountPercentage: discountPercentage,
          minPurchaseAmount: minimumPurchaseAmount,
          maxRedeemAmount: maxRedeemAmount,
          expiryDate: expiryDate,
        },
      },
      { new: true }
    );
    sendSuccessRes(req, res, HttpStatus.OK, MESSAGES.COUPON_UPDATED);
  } catch (error) {
    next(error);
  }
};

const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.validatedBody;

    const coupon = await CouponDB.findById(id);
    if (!coupon) {
      return sendErrorRes(req, res, HttpStatus.NOT_FOUND, MESSAGES.COUPON_NOT_FOUND);
    }

    await CouponDB.findByIdAndDelete(id);
    sendSuccessRes(req, res, HttpStatus.OK, MESSAGES.COUPON_DELETED);
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.validatedBody;
    const coupon = await CouponDB.findById(id);
    if (!coupon) {
      return sendErrorRes(req, res, HttpStatus.NOT_FOUND, MESSAGES.COUPON_NOT_FOUND);
    }

    const newStatus = !coupon.listed;
    await CouponDB.findByIdAndUpdate(id, {
      listed: newStatus,
    });

    sendSuccessRes(req, res, HttpStatus.OK, MESSAGES.COUPON_UPDATED, { listed: newStatus });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loadCouponPage,
  loadAddCoupon,
  addCoupon,
  loadEditCoupon,
  editCoupon,
  deleteCoupon,
  updateStatus,
};
