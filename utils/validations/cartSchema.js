const { z } = require("zod");
const ERROR_MSG = require("../../constants/errorMessages");
const sizes = ['S', 'M', 'L', 'XL'];

const variantAndSizeSchema = z.object({
    variantId: z
        .string({ required_error: ERROR_MSG.INVALID_ID })
        .length(24, ERROR_MSG.INVALID_ID_FORMAT)
        .regex(/^[0-9a-fA-F]+$/, ERROR_MSG.INVALID_ID_FORMAT),

    selectedSize: z.enum(sizes, {
        errorMap: () => ({ message: ERROR_MSG.SELECT_VALID_SIZE })
    })
});

const variantAndQtySchema = z.object({
    variantId: z
        .string({ required_error: ERROR_MSG.INVALID_ID })
        .length(24, ERROR_MSG.INVALID_ID_FORMAT)
        .regex(/^[0-9a-fA-F]+$/, ERROR_MSG.INVALID_ID_FORMAT),
    newQuantity: z.coerce
        .number({ invalid_type_error: "Quantity must be a number." })
        .int("Quantity must be an integer.")
        .min(0, "Stock cannot be negative.")
})

module.exports = { variantAndSizeSchema, variantAndQtySchema }
