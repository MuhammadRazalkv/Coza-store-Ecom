const { z } = require("zod");
const ERROR_MSG = require("../../constants/errorMessages");
const loginSchema = z.object({
    email: z.email(),
    password: z
        .string()
        .min(8, ERROR_MSG.PASSWORD_MIN)
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/, ERROR_MSG.PASSWORD_STRONG),
})

module.exports = loginSchema;