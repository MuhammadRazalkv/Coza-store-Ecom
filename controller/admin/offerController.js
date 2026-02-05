const CategoryDB = require("../../model/categoryModel");
const productDB = require("../../model/productModel");
const variantDB = require("../../model/variantModel");
const OfferDB = require("../../model/offerModel");

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
    const { offerName, selectType, productId, categoryId, discountPercentage, expiryDate } =
      req.body;

    if (offerName == "" || selectType == "" || discountPercentage == "" || expiryDate == "") {
      return res.status(400).json({ message: "fields can not be empty" });
    }

    const regexName = new RegExp(offerName, "i");

    const existingOffer = await OfferDB.findOne({
      offerName: regexName,
    });

    if (existingOffer) {
      return res
        .status(400)
        .json({ success: false, message: "Offer name already exists. Please change it." });
    }

    if (selectType == "Category Offer") {
      if (categoryId == "") {
        return res.status(400).json({ message: "Please select a category" });
      }

      const categoryOffer = await OfferDB.findOne({ categoryId: categoryId });
      if (categoryOffer) {
        return res.status(400).json({ message: "This category already have an offer" });
      }

      const category = await CategoryDB.findOne({ _id: categoryId });

      const offer = new OfferDB({
        offerName: offerName,
        offerType: selectType,
        discountPercentage: parseInt(discountPercentage),
        expiryDate: expiryDate,
        categoryId: categoryId,
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
      return res.status(200).json({ message: "Offer added successfully" });
    } else if (selectType == "Product Offer") {
      if (productId == "") {
        return res.status(400).json({ message: "Please select a category" });
      }
      const productOffer = await OfferDB.findOne({ productId: productId });
      if (productOffer) {
        return res.status(400).json({ message: "This product already have an offer" });
      }
      const product = await productDB.findById(productId);

      const offer = new OfferDB({
        offerName: offerName,
        offerType: selectType,
        discountPercentage: parseInt(discountPercentage),
        expiryDate: expiryDate,
        productId: productId,
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

      return res.status(200).json({ message: "Offer added successfully" });
    } else {
      return res.status(400).json({ message: "No type found" });
    }
  } catch (error) {
    next(error);
  }
};

const changeOfferStatus = async (req, res, next) => {
  try {
    const { offerId } = req.body;

    if (!offerId) {
      return res.status(400).json({ success: false, message: "Offer not found" });
    }

    const offer = await OfferDB.findById(offerId);
    if (!offer) {
      return res.status(400).json({ success: false, message: "Offer not found" });
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

    return res
      .status(200)
      .json({ success: true, message: "Offer status updated successfully", listed: newStatus });
  } catch (error) {
    next(error);
  }
};

const loadEditOffer = async (req, res, next) => {
  try {
    const offerId = req.query.offerId;
    if (!offerId) {
      return res.status(400).json({ message: "Offer id not found" });
    }

    const offer = await OfferDB.findById(offerId);
    if (!offer) {
      return res.status(400).json({ message: "Offer  not found" });
    }
    res.render("editOffer", { offer });
  } catch (error) {
    next(error);
  }
};

const editOffer = async (req, res, next) => {
  try {
    const { offerId, offerName, discountPercentage, expiryDate } = req.body;

    // Validate input fields
    if (!offerId || !offerName || !discountPercentage || !expiryDate) {
      return res.status(400).json({ message: "Fields cannot be empty" });
    }

    // Check for existing offer with the same name
    const regexName = new RegExp(`^${offerName}$`, "i");
    const existingOffer = await OfferDB.findOne({
      offerName: regexName,
      _id: { $ne: offerId },
    });

    if (existingOffer) {
      return res
        .status(400)
        .json({ success: false, message: "Offer name already exists. Please change it." });
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
      return res.status(404).json({ message: "Offer not found" });
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
      return res.status(500).json({ message: "Failed to update variants" });
    }

    return res.status(200).json({ message: "Offer updated successfully" });
  } catch (error) {
    next(error);
  }
};
const deleteOffer = async (req, res, next) => {
  try {
    const { offerId } = req.body;
    if (!offerId) {
      return res.status(400).json({ success: false, message: "Offer ID not provided" });
    }

    const offer = await OfferDB.findById(offerId);
    if (!offer) {
      return res.status(400).json({ success: false, message: "Offer not found" });
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

    return res
      .status(200)
      .json({ success: true, message: "Offer deleted successfully", updateResult });
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
