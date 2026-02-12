const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    isListed: {
      type: Boolean,
      required: true,
      default: false,
    },
    // offerPercentage:{
    //   type:Number
    // }
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offers",
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
