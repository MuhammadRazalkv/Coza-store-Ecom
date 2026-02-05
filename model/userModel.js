const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    mobile: {
      type: Number,
      // required: true
    },
    password: {
      type: String,
      // required: true
    },
    isAdmin: {
      type: Boolean,
      default: false,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
      required: true,
    },
    address: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
