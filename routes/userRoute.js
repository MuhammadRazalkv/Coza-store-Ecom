const express = require("express");
const user_route = express();
const passport = require("passport");
require("../passport");
const cartController = require("../controller/user/cartController");
const orderController = require("../controller/user/orderController");
const userAuth = require("../middleware/userAuth");
const errorHandlingMiddleware = require("../middleware/errorHandling");
const session = require("express-session");
const userController = require("../controller/user/userController");
const validateBody = require("../middleware/validateBody");
const userSchema = require("../utils/validations/userSchema");
const loginSchema = require("../utils/validations/loginSchema");
const profileSchema = require("../utils/validations/profileSchema");
const addressSchema = require("../utils/validations/addressSchema");
const passwordSchema = require("../utils/validations/passwordSchema");


user_route.use(
  session({
    secret: process.env.USER_SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

user_route.set("view engine", "ejs");
user_route.set("views", "./view/user");

user_route.use(express.json());
user_route.use(express.urlencoded({ extended: true }));

user_route.use(passport.initialize());
user_route.use(passport.session());

const attachUserToViews = (req, res, next) => {
  res.locals.user = req.session.user_id ? { id: req.session.user_id } : null;
  next();
};

user_route.use(attachUserToViews);


// Registration routes
user_route.get("/register", userAuth.isLogout, userController.registerPage).
  post("/register", validateBody(userSchema, 'register'), userController.insertUser).
  get("/auth/google", passport.authenticate("google", { scope: ["email", "profile"] })).
  get(
    "/auth/google/callback",
    passport.authenticate("google", {
      successRedirect: "/success",
      failureRedirect: "/failure",
    })
  ).
  get("/success", userController.googleAuth).
  get("/failure", userController.googleFail)

  // OTP routes
  .get("/otpVerification", userAuth.isLogout, userController.otpPage)
  .post("/otpVerification", userController.verifyOTP)
  .get("/resend-otp", userAuth.isLogout, userController.resendOtp)

  //Login routes

  .get("/login", userAuth.isLogout, userController.loginPage)
  .post("/login", validateBody(loginSchema, 'login'), userController.verifyLogin)

  // Logout route
  .get("/logout", userAuth.isLogin, userController.logout)
  .get("/myAccount", userAuth.isLogin, userController.myAccount)
  .patch("/myAccount/editProfile", userAuth.isLogin, validateBody(profileSchema), userController.editProfile)
  .post("/myAccount/save-address", userAuth.isLogin, validateBody(addressSchema), userController.saveAddress)
  .delete(
    "/deleteAddress/:addressId",
    userAuth.isLogin,
    userController.deleteAddress
  )
  .patch("/edit-Address/:addressId", userAuth.isLogin, validateBody(addressSchema), userController.editAddress)
  .patch("/change-password", userAuth.isLogin,validateBody(passwordSchema), userController.changePassword);

// Other routes
user_route.get("/", userController.loadHome);
user_route.get("/home", userController.loadHome);

// cart routes
user_route.get("/cart", userAuth.isLogin, cartController.loadCartPage);
user_route.post("/addToCart", userAuth.isLogin, cartController.addToCart);
user_route.patch("/editCart", userAuth.isLogin, cartController.editCart);
user_route.delete("/deleteCartItem", userAuth.isLogin, cartController.deleteCartItem);

// check out routes
user_route.get("/checkout", userAuth.isLogin, orderController.loadCheckOutPage);
user_route.post("/applyCoupon", userAuth.isLogin, orderController.applyCoupon);

user_route.post("/placeOrder", userAuth.isLogin, orderController.placeOrder);
user_route.post("/verify-payment", userAuth.isLogin, orderController.verifyPayment);
user_route.post("/rePayment", userAuth.isLogin, orderController.rePayment);

user_route.get("/orders", userAuth.isLogin, orderController.loadOrderPage);
user_route.post("/orders/cancelOrder", userAuth.isLogin, orderController.cancelOrder);
user_route.get("/orderTracking", userAuth.isLogin, orderController.loadOrderTrackingPage);
user_route.post("/requestReturn", userAuth.isLogin, orderController.requestReturn);
user_route.get("/downloadInvoice", userAuth.isLogin, orderController.downloadInvoice);

user_route.get("/wishlist", userAuth.isLogin, orderController.loadWishList);
user_route.post("/addToWishlist", userAuth.isLogin, orderController.addToWishlist);
user_route.delete(
  "/removeWishlistItem/:variantId/:selectedSize",
  userAuth.isLogin,
  orderController.removeFromWishlist
);

user_route.get("/about", userController.aboutPage);
user_route.get("/shop_products", userController.shopPage);
user_route.get("/productDetail", userController.productDetail);
user_route.get("/contact", userController.contactPage);

user_route.get("/wallet", userAuth.isLogin, orderController.loadWalletPage);


user_route.use(errorHandlingMiddleware);

module.exports = user_route;
