const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdSchema = z
    .string({ required_error: "Please select a category." })
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Selected category is invalid. Please refresh and try again."
    });

const cancelOrderSchema = z.object({
    orderId: objectIdSchema,
    variantId: objectIdSchema
})

const orderStatusSchema = z.object({
    orderId: objectIdSchema,
    variantId: objectIdSchema,
    status: z.enum(["Processing", "Cancelled", "Shipped", "Delivered", "Return approved", "Return Rejected", "Refunded"], {
        errorMap: () => ({ message: "Invalid status" })
    })
})

const returnReqSchema = z.object({
    orderId: objectIdSchema,
    variantId: objectIdSchema,
    returnReason: z.string({ required_error: "Return reason is required." })
        .regex(/^[A-Za-z\s]{5,}$/, "Name must contain only letters and be at least 5 characters."),
})

module.exports = { cancelOrderSchema, orderStatusSchema, returnReqSchema }