const MESSAGES = Object.freeze({
  // General
  SOMETHING_WENT_WRONG: "Something went wrong. Please try again later.",
  REQUIRED_FIELDS: "Please fill all required fields.",
  INVALID_REQUEST: "Invalid request. Please try again.",

  // Auth
  EMAIL_ALREADY_EXISTS: "An account with this email already exists.",
  PHONE_ALREADY_EXISTS: "An account with this phone number already exists.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  ACCOUNT_NOT_FOUND: "Account not found.",
  ACCOUNT_BLOCKED: "Your account has been blocked. Contact support.",
  LOGIN_SUCCESS: "Login successful.",
  LOGOUT_SUCCESS: "Logged out successfully.",
  REGISTER_SUCCESS: "Registration completed successfully.",
  LOGIN_METHOD_MISMATCH:
    "This account was registered using Google. Please continue with Google login.",
  USER_NOT_FOUND: "User not found.",
  INVALID_ID_FORMAT: "Invalid ID format.",
  // Email / OTP
  OTP_SENT: "OTP has been sent to your email.",
  OTP_INVALID: "Invalid OTP. Please try again.",
  OTP_EXPIRED: "OTP has expired. Request a new one.",
  EMAIL_VERIFIED: "Email verified successfully.",
  EMAIL_NOT_VERIFIED: "Email not verified.",

  // Password
  PASSWORD_INCORRECT: "Current password is incorrect.",
  PASSWORD_UPDATED: "Password updated successfully.",
  PASSWORD_RESET_SENT: "Password reset link sent to your email.",
  PASSWORD_RESET_SUCCESS: "Password reset successful.",

  // Validation
  INVALID_EMAIL: "Please enter a valid email address.",
  INVALID_PHONE: "Please enter a valid phone number.",
  WEAK_PASSWORD:
    "Password must contain at least 8 characters, including uppercase, lowercase, number, and special character.",

  // File upload
  INVALID_FILE_TYPE: "Invalid file type. Only JPG, PNG, or WEBP allowed.",
  FILE_TOO_LARGE: "File size must be less than 5MB.",

  // Product / cart
  PRODUCT_NOT_FOUND: "Product not found.",
  PRODUCT_ADDED: "Product added successfully.",
  PRODUCT_UPDATED: "Product updated successfully.",
  PRODUCT_DELETED: "Product deleted successfully.",
  PRODUCT_EXISTS: "Product name is already taken.",
  PRODUCT_UNAVAILABLE: "Product temporarily unavailable",
  PRODUCT_OUT_OF_STOCK: "Product out of stock",

  CART_EMPTY: "Your cart is empty.",
  ITEM_ADDED_TO_CART: "Item added to cart.",
  ITEM_REMOVED_FROM_CART: "Item removed from cart.",
  ITEM_NOT_FOUND_IN_CART: "No matching product found in the cart",
  CART_UPDATED: "cart updated successfully.",
  PURCHASING_LIMIT: "You can purchase a maximum of 5 units of this item.",

  // Order / payment
  ORDER_PLACED: "Order placed successfully.",
  PAYMENT_FAILED: "Payment failed. Please try again.",
  PAYMENT_SUCCESS: "Payment completed successfully.",
  ORDER_NOT_FOUND: "Order not found,",
  ORDER_CANCELLED: "Order cancelled successfully",
  ORDER_CANCELLED_AND_REFUNDED: "Order cancelled successfully and amount refunded",
  ORDER_STATUS_UPDATED: "Order status updated successfully",
  ADDRESS_ADDED: "Address added successfully",
  LAST_ADDRESS_REMOVED: "Last address deleted successfully",
  ADDRESS_DELETED: "Address deleted successfully",
  ADDRESS_NOT_FOUND: "Address not found",
  ADDRESS_UPDATED: "Address updated successfully",

  CATEGORY_ADDED: "Category added successfully.",
  CATEGORY_EXISTS: "Category already exists.",
  CATEGORY_UPDATED: "Category updated successfully.",
  CATEGORY_NOT_FOUND: "Category not found.",

  THREE_IMAGES_REQUIRED: "Exactly three images required.",
  DUPLICATE_VARIANT: "This variant color already exists",

  INVALID_SIZE_FORMAT: "Invalid sizes format.",

  VARIANT_NOT_FOUND: "Variant not found.",
  VARIANT_EXISTS: "This variant color already exists",
  VARIANT_UPDATED: "Variant updated successfully",
  VARIANT_SIZE_NOT_FOUNT: "The variant doesn't have selected size",

  PURCHASING_LIMIT_REACHED: "Purchasing limit reached",
  PRODUCT_COUNT_INCREASED: "Product count increased successfully",

  COD_NOT_AVAILABLE: "Order above 1000 is not eligible for COD ",

  DUPLICATE_COUPON: "Coupon name or code already exists. Please change it.",
  COUPON_NOT_FOUND: "Coupon not found",
  COUPON_ADDED: "Coupon added successfully",
  COUPON_UPDATED: "Coupon updated successfully",
  COUPON_APPLIED: "Coupon applied successfully",
  COUPON_DELETED: "Coupon deleted successfully",
  INVALID_COUPON: "Coupon invalid",
  COUPON_EXPIRED: "Coupon expired",
  MINIMUM_AMOUNT_NOT_REACH: "Minimum purchase amount not reached",

  DUPLICATE_CATEGORY_OFFER: "This category already have an offer",
  DUPLICATE_PRODUCT_OFFER: "This product already have an offer",
  OFFER_ADDED: "Offer added successfully",
  OFFER_UPDATED: "Offer updated successfully",
  OFFER_DELETED: "Offer deleted successfully",
  DUPLICATE_OFFER: "Offer name already exists. Please change it.",
  OFFER_NOT_FOUND: "Offer not found",

  ITEM_NOT_FOUND_IN_ORDER: "Item not found in order",
});

module.exports = MESSAGES;
