const { z } = require("zod");
const ERROR_MSG = require("../../constants/errorMessages");
const categorySchema = z.object({
    name: z.string().trim().min(3, `Name ${ERROR_MSG.STRING_MIN(3)}`).max(25, `Name ${ERROR_MSG.STRING_MAX(15)}`),
    description: z
        .string()
        .min(8, `Description ${ERROR_MSG.STRING_MIN(8)}`)

})

const editCategorySchema = categorySchema.extend({
    id: z
        .string({ required_error: "Invalid ID." })
        .length(24, "Invalid ID format.")
        .regex(/^[0-9a-fA-F]+$/, "Invalid ID format.")
});


module.exports = {
    categorySchema,
    editCategorySchema
};
