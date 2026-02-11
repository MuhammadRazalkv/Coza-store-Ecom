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
  USER_NOT_FOUND:'User not found.',  

  // Email / OTP
  OTP_SENT: "OTP has been sent to your email.",
  OTP_INVALID: "Invalid OTP. Please try again.",
  OTP_EXPIRED: "OTP has expired. Request a new one.",
  EMAIL_VERIFIED: "Email verified successfully.",

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

  CART_EMPTY: "Your cart is empty.",
  ITEM_ADDED_TO_CART: "Item added to cart.",
  ITEM_REMOVED_FROM_CART: "Item removed from cart.",

  // Order / payment
  ORDER_PLACED: "Order placed successfully.",
  PAYMENT_FAILED: "Payment failed. Please try again.",
  PAYMENT_SUCCESS: "Payment completed successfully.",

  ADDRESS_ADDED:"Address added successfully",
  LAST_ADDRESS_REMOVED:"Last address deleted successfully",
  ADDRESS_DELETED:"Address deleted successfully",
  ADDRESS_NOT_FOUND:"Address not found" ,
  ADDRESS_UPDATED:"Address updated successfully",

 
});

module.exports = MESSAGES;
