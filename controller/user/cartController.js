const User = require("../../model/userModel");
const variantDB = require("../../model/variantModel");
const CartDB = require("../../model/cartModel");
const HttpStatus = require("../../constants/statusCode");
const MESSAGES = require("../../constants/messages");
const sendErrorRes = require("../../utils/sendJsonError");
const sendSuccessRes = require("../../utils/sendSuccessRes");

const loadCartPage = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    if (!userId) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ success: false, message: MESSAGES.USER_NOT_FOUND });
    }

    // Fetching  user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: MESSAGES.USER_NOT_FOUND });
    }

    // Fetching cart items
    // const cart = await CartDB.findOne({ userId }).populate('userId').populate('cartItems.productVariantId')
    const cart = await CartDB.findOne({ userId }).populate({
      path: "cartItems.productVariantId",
      populate: {
        path: "productId",
        model: "Products",
      },
    });

    if (!cart || cart.cartItems.length === 0) {
      return res.render("cart", {
        cartItems: [],
        user: user,
        message: MESSAGES.CART_EMPTY,
        cartTotal: 0
      });
    }
    let cartTotal = cart.cartItems.reduce((acc, curr) => {
      const price = curr.productVariantId.variantPrice
      return price * curr.quantity + acc
    }, 0)

    res.render("cart", {
      cartItems: cart.cartItems,
      user: user,
      message: undefined,
      cartTotal
    });
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { variantId, selectedSize } = req.validatedBody;
    const userId = req.session.user_id;

    const variant = await variantDB.findById(variantId).populate("productId");

    if (!variant) {
      return res.status(HttpStatus.NOT_FOUND).json({ success: false, message: MESSAGES.VARIANT_NOT_FOUND });
    }
    if (!variant.variantListed || !variant.productId.listed) {
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: MESSAGES.PRODUCT_UNAVAILABLE });
    }

    const stockAndSize = variant.sizes.find(({ size }) => size === selectedSize);

    if (!stockAndSize) {
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: MESSAGES.VARIANT_SIZE_NOT_FOUNT });
    }
    if (stockAndSize.stock <= 0) {
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: MESSAGES.PRODUCT_OUT_OF_STOCK });
    }
    const existingCartUser = await CartDB.findOne({ userId });

    if (existingCartUser) {
      const existingCartItem = existingCartUser.cartItems.find(
        (item) =>
          item.productVariantId.toString() === variantId && item.selectedSize === selectedSize
      );

      if (existingCartItem) {
        // Check if there is enough stock to increment quantity

        if (existingCartItem.quantity > 4) {
          return res.status(HttpStatus.BAD_REQUEST).json({ success: true, message: MESSAGES.PURCHASING_LIMIT_REACHED });
        }

        if (stockAndSize.stock > existingCartItem.quantity) {
          existingCartItem.quantity++;
          await existingCartUser.save();
          return res
            .status(HttpStatus.OK)
            .json({ success: true, message: MESSAGES.PRODUCT_COUNT_INCREASED });
        } else {
          // If there is not enough stock, return an error message
          return res
            .status(HttpStatus.BAD_REQUEST)
            .json({
              success: false, message: `Only ${stockAndSize.stock} left in stock.
              We've updated your cart to the available quantity.
              ` });
        }
      }
    }

    const updateCart = {
      productVariantId: variantId,
      selectedSize: selectedSize,
    };

    if (existingCartUser) {
      existingCartUser.cartItems.push(updateCart);

      await existingCartUser.save();
    } else {
      const newCartUser = new CartDB({
        userId: userId,
        cartItems: [updateCart],
      });

      await newCartUser.save();
    }

    res.status(HttpStatus.OK).json({ success: true, message: MESSAGES.ITEM_ADDED_TO_CART });
  } catch (error) {
    next(error);
  }
};

const editCart = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const { variantId, newQuantity } = req.validatedBody;
    const parsedQuantity = parseInt(newQuantity);

    if (!userId) {
      return sendErrorRes(req, res, HttpStatus.BAD_REQUEST, MESSAGES.USER_NOT_FOUND)
    }

    const cart = await CartDB.findOne({ userId })
      .populate("userId")
      .populate("cartItems.productVariantId")
      .populate("cartItems.productVariantId.productId");
    const item = cart.cartItems.find((item) => item.productVariantId._id.toString() === variantId);

    if (!item) {
      return sendErrorRes(req, res, HttpStatus.BAD_REQUEST, MESSAGES.ITEM_NOT_FOUND_IN_CART)
    }


    if (
      item.productVariantId.variantListed == false ||
      item.productVariantId.productId.listed == false
    ) {
      return sendErrorRes(req, res, HttpStatus.BAD_REQUEST, MESSAGES.PRODUCT_UNAVAILABLE)
    } else if (item.productVariantId.variantStock <= 0) {
      return sendErrorRes(req, res, HttpStatus.BAD_REQUEST, MESSAGES.PRODUCT_OUT_OF_STOCK)
    } else if (item.productVariantId.variantStock < parsedQuantity) {
      item.quantity = item.productVariantId.variantStock;
      await cart.save();
      return sendSuccessRes(req, res, HttpStatus.OK, `Quantity adjusted of the product ${item.productVariantId.variantName} to available stock: ${item.productVariantId.variantStock}`, { adjustedQuantity: item.productVariantId.variantStock })
    } else if (parsedQuantity > 5) {
      return sendErrorRes(req, res, HttpStatus.BAD_REQUEST, MESSAGES.PURCHASING_LIMIT)
    }
    else {
      item.quantity = parsedQuantity;
      await cart.save();
      return sendSuccessRes(req, res, HttpStatus.OK, MESSAGES.CART_UPDATED)
    }

  } catch (error) {
    next(error);
  }
};

const deleteCartItem = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const { variantId, selectedSize } = req.validatedBody;


    const updatedData = await CartDB.findOneAndUpdate(
      { userId: userId },
      {
        $pull: {
          cartItems: { productVariantId: variantId, selectedSize: selectedSize },
        },
      },
      { new: true }
    );

    if (!updatedData) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.ITEM_NOT_FOUND_IN_CART,
      });
    }

    return res.status(HttpStatus.OK).json({
      success: true,
      message: MESSAGES.ITEM_REMOVED_FROM_CART,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loadCartPage,
  addToCart,
  editCart,
  deleteCartItem,
};
