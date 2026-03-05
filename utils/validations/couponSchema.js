const { default: mongoose } = require("mongoose");
const { z } = require("zod");

const objectIdSchema = z
  .string({ required_error: "Please select a category." })
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Selected category is invalid. Please refresh and try again.",
  });

const couponSchema = z
  .object({
    couponName: z
      .string()
      .trim()
      .min(2, "Coupon name must be at least 2 characters")
      .max(50, "Coupon name too long"),

    couponCode: z
      .string()
      .trim()
      .min(3, "Coupon code must be at least 3 characters")
      .max(20, "Coupon code too long")
      .regex(/^[A-Z0-9_-]+$/i, "Invalid coupon code format"),

    discountPercentage: z.coerce
      .number({
        required_error: "Discount percentage is required",
        invalid_type_error: "Discount must be a number",
      })
      .min(1, "Discount must be at least 1%")
      .max(100, "Discount cannot exceed 100%"),

    minimumPurchaseAmount: z.coerce
      .number({
        required_error: "Minimum purchase amount is required",
        invalid_type_error: "Minimum purchase must be a number",
      })
      .min(0, "Minimum purchase cannot be negative"),

    maxRedeemAmount: z.coerce
      .number({
        required_error: "Max redeem amount is required",
        invalid_type_error: "Max redeem must be a number",
      })
      .min(1, "Max redeem amount must be at least 1")
      .max(1000, "Coupon max redeem exceeded, MAX 1000"),

    expiryDate: z.coerce.date({
      required_error: "Expiry date is required",
      invalid_type_error: "Invalid expiry date",
    }),
  })
  .refine((data) => data.expiryDate > new Date(), {
    message: "Expiry date must be in the future",
    path: ["expiryDate"],
  });

const editCouponSchema = couponSchema.extend({
  couponId: objectIdSchema,
});

const applyCouponSchema = z.object({
  couponCode: z
    .string()
    .trim()
    .min(3, "Coupon code must be at least 3 characters")
    .max(20, "Coupon code too long")
    .regex(/^[A-Z0-9_-]+$/i, "Invalid coupon code format"),
  cartSubTotal: z.coerce.number(),
});

module.exports = { couponSchema, editCouponSchema, applyCouponSchema };
