const { z } = require("zod");
const ERROR_MSG = require("../../constants/errorMessages");
const profileSchema = z.object({
    name: z.string().trim().min(3, `Name ${ERROR_MSG.STRING_MIN(3)}`).max(25, `Name ${ERROR_MSG.STRING_MAX(25)}`),
    phone: z.string().regex(/^[6-9]\d{9}$/, ERROR_MSG.NUMBER_INVALID),
})

module.exports = profileSchema;