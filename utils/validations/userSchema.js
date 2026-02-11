const { z } = require("zod");
const ERROR_MSG = require("../../constants/errorMessages");

const userSchema = z.object({
  name: z.string().trim().min(3, `Name ${ERROR_MSG.STRING_MIN(3)}`).max(25, `Name ${ERROR_MSG.STRING_MAX(15)}`),
  email: z.email(),
  phone: z.string().regex(/^[6-9]\d{9}$/, ERROR_MSG.NUMBER_INVALID),
  password: z
    .string()
    .min(8, ERROR_MSG.PASSWORD_MIN)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/, ERROR_MSG.PASSWORD_STRONG),
});

module.exports = userSchema;
