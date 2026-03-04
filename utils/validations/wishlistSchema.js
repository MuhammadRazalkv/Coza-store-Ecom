const { z } = require("zod");
const mongoose = require("mongoose");
const ERROR_MSG = require("../../constants/errorMessages");
const sizes = ['S', 'M', 'L', 'XL']
const objectIdSchema = z
    .string({ required_error: "Please select a category." })
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Selected category is invalid. Please refresh and try again."
    });

const wishListSchema = z.object({
    variantId: objectIdSchema,
    selectedSize: z.enum(sizes, {
        errorMap: () => ({ message: ERROR_MSG.SELECT_VALID_SIZE })
    })
})


module.exports = {
    wishListSchema
}