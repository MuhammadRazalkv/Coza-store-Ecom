const mongoose = require("mongoose");
const sizeSchema = require("./sizeSchema");

const variantSchema = mongoose.Schema(
  {
    variantName: {
      type: String,
      required: true,
    },
    sizes: {
      type: [sizeSchema],
      required: true,
      validate: {
        validator: (arr) => arr.length > 0,
        message: "At least one size is required.",
      },
    },
    variantPrice: {
      type: Number,
      required: true,
    },
    // variantDiscountPrice: {
    //   type: Number,
    //   required: true,
    // },
    variantListed: {
      type: Boolean,
      default: true,
    },
    variantColor: {
      type: String,
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Products",
      required: true,
    },
    variantImg: {
      type: [String],
      required: true,
    },
    categoryOffer: {
      offerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Offers",
      },
      discountPercentage: {
        type: Number,
      },
      listed: {
        type: Boolean,
      },
    },
    productOffer: {
      offerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Offers",
      },
      discountPercentage: {
        type: Number,
      },
      listed: {
        type: Boolean,
        default: true,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Variants", variantSchema);
