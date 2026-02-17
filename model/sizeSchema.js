const { default: mongoose } = require("mongoose");

const sizeSchema = new mongoose.Schema({
    size: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
    },
}, { _id: false });

module.exports = sizeSchema;