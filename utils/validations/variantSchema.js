const { z } = require("zod");
const mongoose = require("mongoose");
const ERROR_MSG = require("../../constants/errorMessages");

/* ---------- ObjectId ---------- */
const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), { message: "Invalid product ID." });

/* ---------- Size ---------- */
const sizeSchema = z.object({
  size: z.string({ required_error: "Size is required." }).trim().min(1, "Size cannot be empty."),

  stock: z.coerce
    .number({ invalid_type_error: "Stock must be a number." })
    .int("Stock must be an integer.")
    .min(0, "Stock cannot be negative."),
});

/* ---------- Variant ---------- */
const variantSchema = z.object({
  variantColor: z
    .string({ required_error: "Color is required." })
    .trim()
    .min(3, `Color ${ERROR_MSG.STRING_MIN(3)}`)
    .max(20, `Color ${ERROR_MSG.STRING_MAX(20)}`)
    .regex(/^[A-Za-z\s]+$/, "Color must contain only letters and spaces.")
    .transform((val) => val.toLowerCase()),

  variantPrice: z.coerce
    .number({ invalid_type_error: "Price must be a number." })
    .gt(0, "Price must be greater than ₹0.")
    .max(100000, "Price cannot exceed ₹100000."),

  productId: objectIdSchema,

  sizes: z
    .array(sizeSchema, { required_error: "Sizes are required." })
    .min(1, "At least one size must be provided.")
    .refine(
      (sizes) => {
        const unique = new Set(sizes.map((s) => s.size));
        return unique.size === sizes.length;
      },
      { message: "Duplicate sizes are not allowed." }
    ),
});

const editVariantSchema = variantSchema.extend({
  variantId: objectIdSchema,
});

module.exports = { variantSchema, editVariantSchema };
