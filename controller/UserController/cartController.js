const User = require('../../model/userModel')

const productDB = require('../../model/productModel')
const variantDB = require('../../model/variantModel')
const AddressDB = require('../../model/addressModal')
const CartDB = require('../../model/cartModel')


const loadCartPage = async (req, res,next) => {
  try {
    const userId = req.session.user_id
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: 'User not found, please login again' })
    }

    // Fetching  user details
    const user = await User.findById(userId)
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' })
    }

    // Fetching cart items
    // const cart = await CartDB.findOne({ userId }).populate('userId').populate('cartItems.productVariantId')
    const cart = await CartDB.findOne({ userId }).populate({
      path: 'cartItems.productVariantId',
      populate: {
        path: 'productId',
        model: 'Products'
      }
    })

    if (!cart || cart.cartItems.length === 0) {
      return res.render('cart', {
        cartItems: [],
        user: user,
        message: 'No items in the cart, add a product'
      })
    }

    res.render('cart', {
      cartItems: cart.cartItems,
      user: user,
      message: undefined
    })
  } catch (error) {
    next(error)
  }
}


const addToCart = async (req, res,next) => {
  try {
    const { variantId, selectedSize } = req.body
    const userId = req.session.user_id

    const variant = await variantDB.findById(variantId).populate('productId')

    if (!variant) {
      return res
        .status(400)
        .json({ success: false, message: 'Variant not found' })
    }
    if (variant.variantListed == false) {
      return res
        .status(400)
        .json({ success: false, message: 'Product temporarily unavailable' })
    }
    if (variant.productId.listed == false) {
      return res
        .status(400)
        .json({ success: false, message: 'Product temporarily unavailable' })
    }
    if (variant.variantStock <= 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Product out of stock' })
    }
    if (!variant.variantSizes.includes(selectedSize)) {
      return res
        .status(400)
        .json({ success: false, message: 'Please select a valid size' })
    }

  

    const existingCartUser = await CartDB.findOne({ userId })

    if (existingCartUser) {
      const existingCartItem = existingCartUser.cartItems.find(
        item =>
          item.productVariantId.toString() === variantId 
        &&
          item.selectedSize === selectedSize
      )

      if (existingCartItem) {
        // Check if there is enough stock to increment quantity
        if (variant.variantStock > existingCartItem.quantity) {
          existingCartItem.quantity++;
          await existingCartUser.save();
          return res.status(200).json({ success: true, message: 'Product count increased successfully' });
        } else if(existingCartItem.quantity > 5){
          return res.status(400).json({ success: true, message: 'Purchasing limit reached' });
        }
        else {
          // If there is not enough stock, return an error message
          return res.status(400).json({ success: false, message: `Only ${variant.variantStock} stock left` });
        }
      }

      }
    

    const updateCart = {
      productVariantId: variantId,
      selectedSize: selectedSize
    }

    if (existingCartUser) {
      existingCartUser.cartItems.push(updateCart)

      await existingCartUser.save()
    } else {
      const newCartUser = new CartDB({
        userId: userId,
        cartItems: [updateCart]
      })
     
      await newCartUser.save()
    }

    res
      .status(200)
      .json({ success: true, message: 'Product added to cart successfully' })
  } catch (error) {
    next(error)
  }
}


const editCart = async (req, res) => {
  try {
    const userId = req.session.user_id
    const { variantId, newQuantity } = req.body
    const parsedQuantity = parseInt(newQuantity)

    if (!userId) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'User not found, please ensure that you are logged in'
        })
    }

    const cart = await CartDB.findOne({ userId })
      .populate('userId')
      .populate('cartItems.productVariantId')
      .populate('cartItems.productVariantId.productId')
    const item = cart.cartItems.find(
      item => item.productVariantId._id.toString() === variantId
    )

    if (!item) {
      return res
        .status(400)
        .json({ success: false, message: "Cart item doesn't exist" })
    } else {
      if (
        item.productVariantId.variantListed == false ||
        item.productVariantId.productId.listed == false
      ) {
        return res
          .status(400)
          .json({ success: false, message: 'Product temporarily unavailable' })
      } else if (item.productVariantId.variantStock <= 0) {
        return res
          .status(400)
          .json({ success: false, message: 'Product out of stock' })
      } else if (item.productVariantId.variantStock < parsedQuantity) {
        item.quantity = item.productVariantId.variantStock
        await cart.save()
        return res
          .status(200)
          .json({
            success: true,
            message: `Quantity adjusted of the product ${item.productVariantId.variantName} to available stock: ${item.productVariantId.variantStock}`,
            adjustedQuantity: item.productVariantId.variantStock
          })
      } else if (parsedQuantity <= 0) {
        return res
          .status(400)
          .json({
            success: false,
            message: 'Please select at least one quantity'
          })
      } else {
        //    console.log('In the quantity update phase', parsedQuantity);
        item.quantity = parsedQuantity
        await cart.save()
        return res
          .status(200)
          .json({ success: true, message: 'Cart updated successfully' })
      }
    }
  } catch (error) {
    next(error)
  }
}

const deleteCartItem = async (req, res) => {
  try {
    const userId = req.session.user_id
    const { variantId, selectedSize } = req.body

    if (!variantId || !selectedSize) {
      return res
        .status(400)
        .json({ success: false, message: 'Variant not found' })
    }

    const updatedData = await CartDB.findOneAndUpdate(
      { userId: userId },
      {
        $pull: {
          cartItems: { productVariantId: variantId, selectedSize: selectedSize }
        }
      },
      { new: true }
    )

    if (!updatedData) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'No matching product found in the cart'
        })
    }

    return res
      .status(200)
      .json({
        success: true,
        message: 'Product successfully removed from the cart'
      })
  } catch (error) {
    next(error)
  }
}



module.exports = {
  loadCartPage,
  addToCart,
  editCart,
  deleteCartItem,
  
}
