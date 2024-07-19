const { Timestamp } = require('mongodb')
const mongoose = require('mongoose')

const variantSchema = mongoose.Schema({
     variantName :{
        type:String,
        required:true
     },
     variantStock :{
        type:Number,
        required:true
     },
     variantPrice:{
        type:Number,
      //   required:true
     },
     variantDiscountPrice:{
        type:Number,
        required:true
     },
     variantListed: {
        type: Boolean,
        default: true
    },
    variantSizes: {
        type:[String],
        required:true
    },
    variantColor:{
      type:String,
      required:true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Products',
      required: true
    },
   variantImg: {
    type: [String],
    required: true
  },
  categoryOffer:{
    offerId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'Offers'
    },
    discountPercentage:{
      type:Number,
    },
    listed:{
      type:Boolean
    }
  },
  productOffer:{
   offerId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'Offers'
    },
    discountPercentage:{
      type:Number,
    },
    listed:{
      type:Boolean,
      default:true
    }
   }
},{timestamps:true})

module.exports = mongoose.model('Variants', variantSchema)