const mongoose = require ('mongoose')

const addressSchema = new mongoose.Schema({


    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref: "User",
        required : true
    },
    addresses : [{
            name: {
                type: String,
                required: true
            },

            altPhone: {
                type: Number,
                required: true
            },

            pinCode: {
                type: Number,
                required: true
            },

            locality: {
                type: String,
                required: true
            },

            address: {
                type: String,
                required: true
            },

            city: {
                type: String,
                required: true
            },

            state: {
                type: String,
                required: true
            },

            landmark: {
                type: String,
                required: true
            },

            addressType: {
                type: String,
                required: true
            }

        }],

   


},{timestamps:true})

module.exports = mongoose.model('Address',addressSchema);