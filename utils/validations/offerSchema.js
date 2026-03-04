const { default: mongoose } = require("mongoose");
const { z } = require("zod");

const objectIdSchema = z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid ObjectId",
    });

const baseSchema = z
    .object({
        offerName: z
            .string()
            .trim()
            .min(2, "Offer name must be at least 2 characters")
            .max(100, "Offer name too long"),

        offerType: z.enum(["Category Offer", "Product Offer"]),

        discountPercentage: z
            .coerce.number()
            .min(1, "Discount must be at least 1%")
            .max(90, "Discount too high"),

        listed: z.boolean().optional().default(true),

        expiryDate: z.coerce.date({
            invalid_type_error: "Invalid expiry date",
        }),

        productId: objectIdSchema.optional(),

        categoryId: objectIdSchema.optional(),

        appliedItem: z.string().trim().optional(),
    })

const offerSchema = baseSchema.refine((data) => data.expiryDate > new Date(), {
    message: "Expiry date must be in the future",
    path: ["expiryDate"],
}).superRefine((data, ctx) => {
    if (data.offerType === "Product Offer" && !data.productId) {
        ctx.addIssue({
            code: 'custom',
            message: "productId is required for Product Offer",
            path: ["productId"],
        });
    }

    if (data.offerType === "Category Offer" && !data.categoryId) {
        ctx.addIssue({
            code: 'custom',
            message: "categoryId is required for Category Offer",
            path: ["categoryId"],
        });
    }
});

const editOfferSchema = baseSchema.omit({ offerType: true }).extend({
    offerId: objectIdSchema
})

module.exports = { offerSchema, editOfferSchema }    