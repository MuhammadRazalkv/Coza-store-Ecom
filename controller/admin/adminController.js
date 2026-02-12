const User = require("../../model/userModel");
const bcrypt = require("bcrypt");
const Category = require("../../model/categoryModel");
const Products = require("../../model/productModel");
const OrderDB = require("../../model/orderModal");
const HttpStatus = require("../../constants/statusCode");
const MESSAGES = require("../../constants/messages");
const { default: mongoose } = require("mongoose");

const registerPage = async (req, res, next) => {
  try {
    res.render("adminLogin");
  } catch (error) {
    next(error);
  }
};

const verifyLogin = async (req, res, next) => {
  try {
    const { email, password } = req.validatedBody;

    const admin = await User.findOne({ email: email });

    if (!admin) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: MESSAGES.INVALID_CREDENTIALS });
    }


    const passwordMatch = await bcrypt.compare(password, admin.password);

    if (!passwordMatch) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: MESSAGES.INVALID_CREDENTIALS });
    }

    if (admin.isAdmin == false) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: MESSAGES.INVALID_CREDENTIALS });

    }
    req.session.admin_id = admin._id;

    return res.status(HttpStatus.OK).json({
      success: true,
      redirect: "/admin/home"
    });

  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    req.session.destroy();
    return res.redirect("/admin");
  } catch (error) {
    next(error);
  }
};

const loadHome = async (req, res, next) => {
  try {
    const filter = req.query.filter || "All";

    let matchCondition = { "orderItems.cancelledOrRefunded": false };

    if (filter === "daily") {
      const today = new Date();
      matchCondition.orderDate = {
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lt: new Date(today.setHours(23, 59, 59, 999)),
      };
    } else if (filter === "weekly") {
      const today = new Date();
      const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
      const lastDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
      matchCondition.orderDate = {
        $gte: new Date(firstDayOfWeek.setHours(0, 0, 0, 0)),
        $lt: new Date(lastDayOfWeek.setHours(23, 59, 59, 999)),
      };
    } else if (filter === "yearly") {
      const thisYear = new Date().getFullYear();
      matchCondition.orderDate = {
        $gte: new Date(thisYear, 0, 1),
        $lt: new Date(thisYear, 11, 31, 23, 59, 59, 999),
      };
    } else if (filter === "monthly") {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();

      matchCondition.orderDate = {
        $gte: new Date(year, month, 1),
        $lt: new Date(year, month + 1, 1),
      };
    }

    let productSales = await OrderDB.aggregate([
      { $unwind: "$orderItems" },
      { $match: matchCondition },
      {
        $group: {
          _id: "$orderItems.variantName",
          totalSold: { $sum: "$orderItems.quantity" },
          productName: { $first: "$orderItems.variantName" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 6 },
    ]);

    let xValues = productSales.map((item) => item.productName);
    let yValues = productSales.map((item) => item.totalSold);

    let products = await OrderDB.aggregate([
      { $unwind: "$orderItems" },
      { $match: { "orderItems.cancelledOrRefunded": false } },
      {
        $group: {
          _id: "$orderItems.variantName",
          totalSold: { $sum: "$orderItems.quantity" },
          productName: { $first: "$orderItems.variantName" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);

    const topCategories = await OrderDB.aggregate([
      { $unwind: "$orderItems" },
      { $match: { "orderItems.cancelledOrRefunded": false } },
      {
        $group: {
          _id: "$orderItems.categoryName",
          totalSold: { $sum: "$orderItems.quantity" },
          categoryName: { $first: "$orderItems.categoryName" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);

    const topBrands = await OrderDB.aggregate([
      { $unwind: "$orderItems" },
      { $match: { "orderItems.cancelledOrRefunded": false } },

      {
        $lookup: {
          from: "products",
          localField: "orderItems.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },

      {
        $group: {
          _id: "$productDetails.productBrand",
          totalSold: { $sum: "$orderItems.quantity" },
          brandName: { $first: "$productDetails.productBrand" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);

    const userCount = await User.countDocuments({ isAdmin: false });
    const orderCount = await OrderDB.countDocuments();
    const productCount = await Products.countDocuments();
    const categoryCount = await Category.countDocuments();

    if (req.xhr || req.headers.accept.indexOf("json") > -1) {
      res.json({ xValues, yValues });
    } else {
      res.render("home", {
        xValues,
        yValues,
        message: undefined,
        products,
        topCategories,
        topBrands,
        userCount,
        orderCount,
        productCount,
        categoryCount,
      });
    }
  } catch (error) {
    next(error);
  }
};

const userManagement = async (req, res, next) => {
  try {
    const limit = 10;
    const page = Math.max(1, parseInt(req.query.page)) || 1;
    const skip = (page - 1) * limit;

    const userData = await User.find({ isAdmin: false }).skip(skip).limit(limit);
    const userCount = await User.countDocuments({ isAdmin: false });
    const totalPages = Math.ceil(userCount / limit);

    res.render("userList", {
      user: userData,
      message: undefined,
      page,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

const blockUnblock = async (req, res, next) => {
  const { id } = req.validatedBody;

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: MESSAGES.ACCOUNT_NOT_FOUND });
    }

    const updatedStatus = !user.isBlocked;

    await User.findByIdAndUpdate(id, { isBlocked: updatedStatus });


    return res.status(HttpStatus.OK).json({
      message: updatedStatus ? "User blocked successfully" : "User unblocked successfully",
      listed: updatedStatus,
    });
  } catch (error) {
    next(error);
  }
};

const categoryManagement = async (req, res, next) => {
  try {
    const categories = await Category.find({});
    res.render("categoryManagement", { categories });
  } catch (error) {
    next(error);
  }
};

const loadAddCategory = async (req, res, next) => {
  try {
    res.render("addCategory");
  } catch (error) {
    next(error);
  }
};

const addCategory = async (req, res, next) => {
  try {
    let { name, description } = req.validatedBody;
    name = name.toLowerCase()
    const categories = await Category.findOne({ name: name });
    if (categories) {
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: MESSAGES.CATEGORY_EXISTS});
    }
    const newCategory = new Category({ name, description });
    await newCategory.save();
    return res.status(HttpStatus.OK).json({ success: true, messages: MESSAGES.CATEGORY_ADDED })
  } catch (error) {
    next(error);
  }
};

const loadEditCategory = async (req, res, next) => {
  try {
    const id = req.query.id;

    //  Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).render("editCategory", {
        error: "Invalid category ID.",
        categories: null
      });
    }

    //  Find category
    const categories = await Category.findById(id);

    //  Handle not found
    if (!categories) {
      return res.status(404).render("editCategory", {
        error: "Category not found.",
        categories: null
      });
    }


    res.render("editCategory", { categories, error: null });
  } catch (error) {
    next(error);
  }
};

const editCategory = async (req, res, next) => {
  try {
    let { id, name, description } = req.validatedBody;
    name = name.toLowerCase()


    const existingCategory = await Category.findOne({
      name,
      _id: { $ne: id },
    });

    if (existingCategory) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: MESSAGES.CATEGORY_EXISTS });
    }

    await Category.findByIdAndUpdate(
      id,
      {
        $set: {
          name: name,
          description: description,
        },
      }
    );
    return res.status(HttpStatus.OK).json({ message: MESSAGES.CATEGORY_UPDATED });
  } catch (error) {
    next(error);
  }
};

const softDeleteCategory = async (req, res, next) => {
  try {
    const { id } = req.validatedBody;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: MESSAGES.CATEGORY_NOT_FOUND});
    }
    const updatedStatus = !category.isListed;
 
    await Category.findByIdAndUpdate(id, { isListed: updatedStatus });

    return res.status(HttpStatus.OK).json({
      message: category.isListed
        ? "Category unlisted successfully"
        : "Category listed successfully",
      listed: updatedStatus,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyLogin,
  loadHome,
  registerPage,
  userManagement,
  categoryManagement,
  blockUnblock,
  addCategory,
  editCategory,
  softDeleteCategory,
  loadAddCategory,
  loadEditCategory,
  logout,
};
