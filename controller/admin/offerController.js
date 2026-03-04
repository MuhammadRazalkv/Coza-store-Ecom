const CategoryDB = require("../../model/categoryModel");
const productDB = require("../../model/productModel");
const variantDB = require("../../model/variantModel");
const OfferDB = require("../../model/offerModel");
const sendErrorRes = require("../../utils/sendJsonError");
const HttpStatus = require("../../constants/statusCode");
const MESSAGES = require("../../constants/messages");
const sendSuccessRes = require("../../utils/sendSuccessRes");
const { isValidObjectId } = require("mongoose");

const loadOfferPage = async (req, res, next) => {
  try {
    const offers = await OfferDB.find();

    return res.render("offerManagement", { offers, message: undefined });
  } catch (error) {
    next(error);
  }
};

const loadAddOffer = async (req, res, next) => {
  try {
    const products = await productDB.find();
    const categories = await CategoryDB.find();

    res.render("addOffer", { products, categories });
  } catch (error) {
    next(error);
  }
};

const addOffer = async (req, res, next) => {
  try {
    const { offerName, offerType, productId, categoryId, discountPercentage, expiryDate } =
      req.validatedBody;
    const regexName = new RegExp(offerName, "i");

    const existingOffer = await OfferDB.findOne({
      offerName: regexName,
    });

    if (existingOffer) {
      return sendErrorRes(req, res, HttpStatus.CONFLICT, MESSAGES.DUPLICATE_OFFER)
    }

    if (offerType == "Category Offer") {

      const categoryOffer = await OfferDB.findOne({ categoryId: categoryId });
      if (categoryOffer) {
        return sendErrorRes(req, res, HttpStatus.CONFLICT, MESSAGES.DUPLICATE_CATEGORY_OFFER)
      }

      const category = await CategoryDB.findOne({ _id: categoryId });

      const offer = new OfferDB({
        offerName,
        offerType,
        discountPercentage,
        expiryDate,
        categoryId,
        appliedItem: category.name,
      });

      const products = await productDB.find({ categoryId: categoryId }).select("_id").lean();
      const productIds = products.map((product) => product._id);

      // Update the category offer for all variants of these products

      await offer.save();
      await variantDB.updateMany(
        { productId: { $in: productIds } },
        {
          $set: {
            "categoryOffer.offerId": offer._id,
            "categoryOffer.discountPercentage": offer.discountPercentage,
            "categoryOffer.listed": true,
          },
        },
        { upsert: true }
      );
      await CategoryDB.findOneAndUpdate(
        { _id: categoryId },
        {
          $set: { offerId: offer._id },
        },
        { upsert: true }
      );
      return sendSuccessRes(req, res, HttpStatus.OK, MESSAGES.OFFER_ADDED)
    } else if (offerType == "Product Offer") {
      const productOffer = await OfferDB.findOne({ productId });
      if (productOffer) {
        return sendErrorRes(req, res, HttpStatus.CONFLICT, MESSAGES.DUPLICATE_PRODUCT_OFFER)
      }
      const product = await productDB.findById(productId);

      const offer = new OfferDB({
        offerName,
        offerType,
        discountPercentage,
        expiryDate,
        productId,
        appliedItem: product.productName,
      });

      await offer.save();

      await variantDB.updateMany(
        { productId: productId },
        {
          $set: {
            "productOffer.offerId": offer._id,
            "productOffer.discountPercentage": offer.discountPercentage,
            "productOffer.listed": true,
          },
        },
        { upsert: true }
      );

      return sendSuccessRes(req, res, HttpStatus.OK, MESSAGES.OFFER_ADDED)
    }
  } catch (error) {
    next(error);
  }
};

const changeOfferStatus = async (req, res, next) => {
  try {
    const { id: offerId } = req.validatedBody;


    const offer = await OfferDB.findById(offerId);
    if (!offer) {
      return sendErrorRes(req, res, HttpStatus.NOT_FOUND, MESSAGES.OFFER_NOT_FOUND)
    }

    const newStatus = !offer.listed;
    await OfferDB.findByIdAndUpdate(offerId, {
      listed: newStatus,
    });

    if (offer.offerType === "Category Offer") {
      await variantDB.updateMany(
        { "categoryOffer.offerId": offerId },
        { $set: { "categoryOffer.listed": newStatus } }
      );
    } else {
      await variantDB.updateMany(
        { "productOffer.offerId": offerId },
        { $set: { "productOffer.listed": newStatus } }
      );
    }

    sendSuccessRes(req, res, HttpStatus.OK, MESSAGES.OFFER_UPDATED, { listed: newStatus })
  } catch (error) {
    next(error);
  }
};

const loadEditOffer = async (req, res, next) => {
  try {
    const offerId = req.query.offerId;
    if (!isValidObjectId(offerId)) {
      return res.render("editOffer", { offer: null, message: MESSAGES.INVALID_ID_FORMAT })
    }

    const offer = await OfferDB.findById(offerId);
    if (!offer) {
      return res.render("editOffer", { offer: null, message: MESSAGES.OFFER_NOT_FOUND })
    }
    res.render("editOffer", { offer, message: null });
  } catch (error) {
    next(error);
  }
};

const editOffer = async (req, res, next) => {
  try {
    const { offerId, offerName, discountPercentage, expiryDate } = req.validatedBody;

    // Check for existing offer with the same name
    const regexName = new RegExp(`^${offerName}$`, "i");
    const existingOffer = await OfferDB.findOne({
      offerName: regexName,
      _id: { $ne: offerId },
    });

    if (existingOffer) {
      return sendErrorRes(req, res, HttpStatus.CONFLICT, MESSAGES.DUPLICATE_OFFER)
    }

    // Update the offer
    const updatedOffer = await OfferDB.findByIdAndUpdate(
      offerId,
      {
        $set: {
          offerName: offerName,
          discountPercentage: discountPercentage,
          expiryDate: expiryDate,
        },
      },
      { new: true }
    );

    if (!updatedOffer) {
      return sendErrorRes(req, res, HttpStatus.NOT_FOUND, MESSAGES.OFFER_NOT_FOUND)
    }

    // Update the discount percentage in the variants
    let updateResult;
    if (updatedOffer.offerType === "Product Offer") {
      updateResult = await variantDB.updateMany(
        { "productOffer.offerId": offerId },
        { $set: { "productOffer.discountPercentage": discountPercentage } }
      );
    } else if (updatedOffer.offerType === "Category Offer") {
      updateResult = await variantDB.updateMany(
        { "categoryOffer.offerId": offerId },
        { $set: { "categoryOffer.discountPercentage": discountPercentage } }
      );
    }

    if (!updateResult) {
      return sendErrorRes(req, res, HttpStatus.INTERNAL_SERVER_ERROR, "Failed to update variants")
    }
    sendSuccessRes(req, res, HttpStatus.OK, MESSAGES.OFFER_UPDATED)
  } catch (error) {
    next(error);
  }
};
const deleteOffer = async (req, res, next) => {
  try {
    const { id: offerId } = req.body;


    const offer = await OfferDB.findById(offerId);
    if (!offer) {
      return sendErrorRes(HttpStatus.NOT_FOUND, MESSAGES.OFFER_NOT_FOUND)
    }

    let updateResult;

    if (offer.offerType === "Product Offer") {
      // Update variants with this product offer
      updateResult = await variantDB.updateMany(
        { "productOffer.offerId": offerId },
        { $unset: { productOffer: "" } }
      );
    } else {
      updateResult = await variantDB.updateMany(
        { "categoryOffer.offerId": offerId },
        { $unset: { categoryOffer: "" } }
      );
    }

    await OfferDB.findByIdAndDelete(offerId);

    sendSuccessRes(req, res, HttpStatus.OK, MESSAGES.OFFER_DELETED, { updateResult })

  } catch (error) {
    next(error);
  }
};

module.exports = {
  loadOfferPage,
  loadAddOffer,
  addOffer,
  changeOfferStatus,
  loadEditOffer,
  editOffer,
  deleteOffer,
};
