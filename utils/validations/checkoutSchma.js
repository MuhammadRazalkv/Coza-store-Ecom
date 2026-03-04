const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdSchema = z
    .string({ required_error: "Please select a category." })
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Selected category is invalid. Please refresh and try again."
    });

const checkoutSchema = z.object({
    addressId: objectIdSchema,
    selectedOption: z.enum(["Online-Payment", "COD"], {
        errorMap: () => ({ message: "Invalid payment method." })
    }),
    appliedCoupon: z.string().min(3, 'Invalid coupon code').nullable().optional()
})

module.exports = {
    checkoutSchema
}