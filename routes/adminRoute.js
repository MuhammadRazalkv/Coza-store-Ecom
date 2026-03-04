const express = require("express");
const adminRoute = express();
const dotenv = require("dotenv");
const nocache = require("nocache");
const adminAuth = require("../middleware/adminAuth");
const upload = require("../middleware/multer");
const orderController = require("../controller/admin/orderControllerAdmin");
dotenv.config();
const couponController = require("../controller/admin/couponController");
const adminController = require("../controller/admin/adminController");
const productController = require("../controller/admin/productController");
const offerController = require("../controller/admin/offerController");
const session = require("express-session");
const validateBody = require("../middleware/validateBody");
const errorHandling = require("../middleware/adminError");
const loginSchema = require("../utils/validations/loginSchema");
const objectIdSchema = require("../utils/validations/objectIdSchema");
const { categorySchema, editCategorySchema } = require("../utils/validations/categorySchema");
const { productSchema, editProductSchema } = require("../utils/validations/productSchema");
const { variantSchema, editVariantSchema } = require("../utils/validations/variantSchema");
const parseSizes = require("../middleware/sizeParser");
const { couponSchema, editCouponSchema } = require("../utils/validations/couponSchema");
const { offerSchema, editOfferSchema } = require("../utils/validations/offerSchema");
const { orderStatusSchema } = require("../utils/validations/orderSchema");


adminRoute.use(express.json());
adminRoute.use(express.urlencoded({ extended: true }));

adminRoute.set("view engine", "ejs");
adminRoute.set("views", "./view/admin");

adminRoute.use(
  session({
    secret: process.env.ADMIN_SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

// adminRoute.get('/login',adminController.registerPage)
adminRoute.use(nocache());

adminRoute.get("/", adminAuth.isLogout, adminController.registerPage)
  .post("/", adminAuth.isLogout, validateBody(loginSchema), adminController.verifyLogin)
  .get("/logout", adminAuth.isLogin, adminController.logout)
  .get("/home", adminAuth.isLogin, adminController.loadHome)
  .get("/user-List", adminAuth.isLogin, adminController.userManagement)
  .patch("/user-block", adminAuth.isLogin, validateBody(objectIdSchema), adminController.blockUnblock)
  .get("/category-list", adminAuth.isLogin, adminController.categoryManagement)
  .get("/categories/add", adminAuth.isLogin, adminController.loadAddCategory)
  .post("/categories/add", adminAuth.isLogin, validateBody(categorySchema), adminController.addCategory)
  .get("/categories/edit", adminAuth.isLogin, adminController.loadEditCategory)
  .post("/categories/edit", adminAuth.isLogin, validateBody(editCategorySchema), adminController.editCategory)
  .patch("/categories/delete", adminAuth.isLogin, validateBody(objectIdSchema), adminController.softDeleteCategory)
  .get("/products-list", adminAuth.isLogin, productController.loadProductPage)
  .get("/product/add", adminAuth.isLogin, productController.loadAddProduct)
  .post("/product/add", adminAuth.isLogin, validateBody(productSchema), productController.addProduct)
  .get("/product/details", adminAuth.isLogin, productController.loadProductDetails)
  .get("/product/edit", adminAuth.isLogin, productController.loadEditProduct)
  .post("/product/edit", adminAuth.isLogin, validateBody(editProductSchema), productController.editProduct)
  .post("/product/delete", adminAuth.isLogin, validateBody(objectIdSchema), productController.blockProduct)
  .get("/product/addVariant", adminAuth.isLogin, productController.loadAddVariant)
  .post("/product/addVariant", adminAuth.isLogin, upload, parseSizes, validateBody(variantSchema), productController.addVariant)
  .get("/product/editVariant", adminAuth.isLogin, productController.loadEditVariant)
  .post(
    "/product/editVariant/:id",
    adminAuth.isLogin,
    upload,
    parseSizes,
    validateBody(editVariantSchema),
    productController.editVariant
  )
  .patch("/product/blockVariant", adminAuth.isLogin, validateBody(objectIdSchema), productController.blockUnblockVariant)

  .get("/orderDetails", adminAuth.isLogin, orderController.loadOrderPage)
  .get("/userOrders/:orderId", adminAuth.isLogin, orderController.loadOrderDetailsPage)
  .post(
    "/userOrders/change-status",
    adminAuth.isLogin,
    validateBody(orderStatusSchema),
    orderController.changeOrderStatus
  )

  .get("/couponList", adminAuth.isLogin, couponController.loadCouponPage)
  .get("/addCoupon", adminAuth.isLogin, couponController.loadAddCoupon)
  .post("/addCoupon", adminAuth.isLogin, validateBody(couponSchema), couponController.addCoupon)
  .get("/editCoupon", adminAuth.isLogin, couponController.loadEditCoupon)
  .post("/editCoupon", adminAuth.isLogin, validateBody(editCouponSchema), couponController.editCoupon)
  .patch("/couponstatus", adminAuth.isLogin, validateBody(objectIdSchema), couponController.updateStatus)
  .delete("/deleteCoupon", adminAuth.isLogin, validateBody(objectIdSchema), couponController.deleteCoupon)


  .get("/offers", adminAuth.isLogin, offerController.loadOfferPage)
  .get("/addOffer", adminAuth.isLogin, offerController.loadAddOffer)
  .post("/addOffer", adminAuth.isLogin, validateBody(offerSchema), offerController.addOffer)
  .patch("/offers/changeStatus", adminAuth.isLogin, validateBody(objectIdSchema), offerController.changeOfferStatus)
  .get("/offers/editOffer", adminAuth.isLogin, offerController.loadEditOffer)
  .post("/offers/editOffer", adminAuth.isLogin, validateBody(editOfferSchema), offerController.editOffer)
  .delete("/offers/deleteOffer", adminAuth.isLogin, validateBody(objectIdSchema), offerController.deleteOffer)


  .get("/salesReport", adminAuth.isLogin, orderController.loadSalesReport)
  .get("/logout", adminController.logout);
// adminRoute.get('/downloadSalesReport',orderController.downloadSalesReport)
// adminRoute.get('/salesReport/downloadPDFReport',orderController.downloadPDFReport)
adminRoute.all("*", (req, res) => {
  res.render("error");
});


adminRoute.use(errorHandling);

module.exports = adminRoute;
