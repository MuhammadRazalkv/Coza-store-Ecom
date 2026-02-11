const { z } = require("zod");
const ERROR_MSG = require("../../constants/errorMessages");
const MESSAGES = require("../../constants/messages");
const passwordSchema = z.object({
    currentPassword: z
        .string()
        .min(8, ERROR_MSG.PASSWORD_MIN)
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/,  MESSAGES.PASSWORD_INCORRECT),
    newPassword: z
        .string()
        .min(8, ERROR_MSG.PASSWORD_MIN)
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/, ERROR_MSG.PASSWORD_STRONG),
})

module.exports = passwordSchema;