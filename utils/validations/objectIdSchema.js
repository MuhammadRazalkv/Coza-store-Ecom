const { z } = require("zod");

const objectIdSchema = z.object({
    id: z
        .string({ required_error: "Invalid ID." })
        .length(24, "Invalid ID format.")
        .regex(/^[0-9a-fA-F]+$/, "Invalid ID format.")
})

module.exports = objectIdSchema;