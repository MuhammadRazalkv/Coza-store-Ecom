const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdSchema = z
  .string({ required_error: "Please select a category." })
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Selected category is invalid. Please refresh and try again.",
  });

const nameBrandRegex = /^[A-Za-z0-9 &-]+$/;

const productSchema = z.object({
  productName: z
    .string({ required_error: "Product name is required." })
    .trim()
    .min(3, "Product name must be at least 3 characters long.")
    .max(20, "Product name must be less than 20 characters")
    .regex(nameBrandRegex, "Product name can only contain letters, numbers, spaces, & or -."),

  productBrand: z
    .string({ required_error: "Brand name is required." })
    .trim()
    .min(2, "Brand name must be at least 2 characters long.")
    .regex(nameBrandRegex, "Brand name can only contain letters, numbers, spaces, & or -."),

  productCategory: objectIdSchema,

  productDescription: z
    .string({ required_error: "Product description is required." })
    .trim()
    .min(8, "Product description must be at least 8 characters long."),
});

const editProductSchema = productSchema.extend({
  id: objectIdSchema,
});

module.exports = {
  productSchema,
  editProductSchema,
};
