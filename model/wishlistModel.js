const mongoose = require ('mongoose')

const wishlistSchema = new mongoose.Schema({
  userId :{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true
  },
  variantItems:[{
    variantId: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Variants'
    }],
    selectedSize:{
      type:String,
      required : true
    }
  }]
 
},{timestamps:true})

module.exports = mongoose.model('Wishlist', wishlistSchema)