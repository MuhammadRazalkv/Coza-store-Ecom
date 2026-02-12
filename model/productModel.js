const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    productBrand: {
      type: String,
      required: true,
    },
    listed: {
      type: Boolean,
      default: true,
    },
    variant: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Variants",
      },
    ],
    offerPercentage: {
      type: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Products", productSchema);
