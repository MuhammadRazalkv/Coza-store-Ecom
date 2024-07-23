const express = require('express')
const user_route = express()
const passport = require('passport')
require('../passport')
const cartController = require('../controller/UserController/cartController')
const orderController = require('../controller/UserController/orderController')

const userAuth = require('../middleware/userAuth')

const session = require('express-session')

user_route.use(session({
    secret:'onethesessionsecret',
    resave:false,
    saveUninitialized:true
}))



user_route.set('view engine', 'ejs')
user_route.set('views', './view/user')

user_route.use(express.json())
user_route.use(express.urlencoded({ extended: true }))

user_route.use(passport.initialize())
user_route.use(passport.session())

const attachUserToViews = (req, res, next) => {
  res.locals.user = req.session.user_id ? { id: req.session.user_id } : null;
  next();
};

user_route.use(attachUserToViews);


const userController = require('../controller/UserController/userController')
// Registration routes 
user_route.get('/register', userAuth.isLogout, userController.registerPage);
user_route.post('/register', userController.insertUser);


user_route.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['email', 'profile'] })
)

user_route.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/success',
    failureRedirect: '/failure'
  })
)




user_route.get('/success', userController.googleAuth)
user_route.get('/failure', userController.googleFail)

// OTP routes
user_route.get('/otpVerification', userAuth.isLogout, userController.otpPage);
user_route.post('/otpVerification', userController.verifyOTP);
user_route.get('/resend-otp', userAuth.isLogout, userController.resendOtp);

//Login routes 

user_route.get('/login', userAuth.isLogout, userController.loginPage);
user_route.post('/login', userController.verifyLogin);

// Logout route
user_route.get('/logout',userAuth.isLogin, userController.logout);

user_route.get('/myAccount',userAuth.isLogin, userController.myAccount);
user_route.patch('/myAccount/editProfile/:id',userAuth.isLogin,userController.editProfile)
// user_route.post('/myAccount/save-address/:id',userAuth.isLogin,userController.saveAddress)
user_route.post('/myAccount/save-address',userAuth.isLogin,userController.saveAddress)
user_route.delete('/deleteAddress/:userId/:addressId',userAuth.isLogin, userController.deleteAddress);
user_route.patch('/edit-Address/:userId/:addressId',userAuth.isLogin,userController.editAddress)
user_route.patch('/change-password/:userId',userAuth.isLogin,userController.changePassword)

// Other routes
user_route.get('/', userController.loadHome);
user_route.get('/home',userController.loadHome)


// cart routes 
user_route.get('/cart',userAuth.isLogin,cartController.loadCartPage);
user_route.post('/addToCart',userAuth.isLogin,cartController.addToCart)
user_route.patch('/editCart',userAuth.isLogin,cartController.editCart)
user_route.delete('/deleteCartItem', userAuth.isLogin, cartController.deleteCartItem);

// check out routes 
user_route.get('/checkout',userAuth.isLogin,orderController.loadCheckOutPage)
user_route.post('/applyCoupon',userAuth.isLogin,orderController.applyCoupon)



user_route.post('/placeOrder',userAuth.isLogin,orderController.placeOrder)
user_route.post('/verify-payment',userAuth.isLogin,orderController.verifyPayment)
user_route.post('/rePayment',userAuth.isLogin,orderController.rePayment)

user_route.get('/orders',userAuth.isLogin,orderController.loadOrderPage)
user_route.post('/orders/cancelOrder',userAuth.isLogin,orderController.cancelOrder)
user_route.get('/orderTracking',userAuth.isLogin,orderController.loadOrderTrackingPage)
user_route.post('/requestReturn',userAuth.isLogin,orderController.requestReturn)
user_route.get('/downloadInvoice',userAuth.isLogin,orderController.downloadInvoice)

user_route.get('/wishlist',userAuth.isLogin,orderController.loadWishList)
user_route.post('/addToWishlist',userAuth.isLogin,orderController.addToWishlist)
user_route.delete('/removeWishlistItem/:variantId/:selectedSize',userAuth.isLogin,orderController.removeFromWishlist)

user_route.get('/about', userController.aboutPage);
user_route.get('/shop_products', userController.shopPage);
user_route.get('/productDetail', userController.productDetail);
user_route.get('/contact', userController.contactPage);


user_route.get('/wallet',userAuth.isLogin,orderController.loadWalletPage)

const errorHandlingMiddleware = require('../middleware/errorHandling')
user_route.use(errorHandlingMiddleware)


module.exports = user_route
