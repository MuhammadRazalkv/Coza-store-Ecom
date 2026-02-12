const User = require("../../model/userModel");
const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const mailSender = require("../../utils/mailSender");
const PendingUser = require("../../model/pendingUserModel");
const productDB = require("../../model/productModel");
const CategoryDB = require("../../model/categoryModel");
const variantDB = require("../../model/variantModel");
const AddressDB = require("../../model/addressModal");

//User Authentication
const { ObjectId } = require("mongodb");
const MESSAGES = require("../../constants/messages");
const HttpStatus = require("../../constants/statusCode");

function isValidObjectId(id) {
  return ObjectId.isValid(id)
}

const registerPage = async (req, res, next) => {
  try {
    res.render("register", { old: null });
  } catch (error) {
    next(error);
  }
};

const securePassword = async (password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return hashedPassword;
};

//* Generating random OTP

const generateOTP = () => {
  return otpGenerator.generate(4, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
};

const insertUser = async (req, res, next) => {
  try {
    const { name, email, phone } = req.validatedBody;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render("register", { message: MESSAGES.EMAIL_ALREADY_EXISTS });
    }

    const otp = generateOTP();
    const sPassword = await securePassword(req.validatedBody.password.trim());
    const pendingUser = new PendingUser({
      name,
      email,
      phone,
      password: sPassword,
      otp,
      otpExpires: Date.now() + 1 * 60 * 1000, // OTP expires in 1 minutes
    });
    await pendingUser.save();
    await mailSender(email, otp);

    return res.redirect(`/otpVerification?email=${email}`);
  } catch (error) {
    next(error);
  }
};

const otpPage = async (req, res, next) => {
  try {
    const { email } = req.query;
    const pendingUser = await PendingUser.findOne({ email });
    if (!pendingUser) {
      return res.status(HttpStatus.BAD_REQUEST).render("register", { message: "User not found", old: null });
    }
    res.render("otp", { email: email });
  } catch (error) {
    next(error);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.redirect("register", { message: "Email not found", old: null });
    }

    const pendingUser = await PendingUser.findOne({ email: email });
    if (!pendingUser) {
      console.log(pendingUser);
      
      return res.render("register", { message: "User not found", old: null });
    }

    const otp = generateOTP();

    pendingUser.otp = otp;
    pendingUser.otpExpires = Date.now() + 1 * 60 * 1000; // Reset OTP expiry time

    await pendingUser.save();
    await mailSender(email, otp);

    return res.redirect(`/otpVerification?email=${email}`);
  } catch (error) {
    next(error);
  }
};

const verifyOTP = async (req, res, next) => {
  try {
    // const { otp1, otp2, otp3, otp4 } = req.body
    // const otp = otp1 + otp2 + otp3 + otp4
    const { otp } = req.body;
    const { email } = req.query;

    const pendingUser = await PendingUser.findOne({ email: email });

    if (!pendingUser) {
      return res.render("otp", { message: "Invalid OTP or OTP has expired" });
    }

    if (otp === pendingUser.otp && pendingUser.otpExpires > Date.now()) {
      const user = new User({
        name: pendingUser.name,
        email: pendingUser.email,
        phone: pendingUser.phone,
        password: pendingUser.password,
        joinedDate: pendingUser.joinedDate,
        isAdmin: false,
        isBlocked: false,
        isVerified: true,
      });

      req.session.user_id = user._id;
      await user.save();
      await PendingUser.deleteOne({ email: email });

      return res.redirect("/");
    } else {
      return res.render("otp", { success: false, message: "Invalid OTP", email });
    }
  } catch (error) {
    next(error);
  }
};

const loginPage = async (req, res, next) => {
  try {
    res.render("login");
  } catch (error) {
    next(error);
  }
};

const verifyLogin = async (req, res, next) => {
  try {
    const { email, password } = req.validatedBody;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: MESSAGES.INVALID_CREDENTIALS });
    }
    if (!user.password) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: MESSAGES.LOGIN_METHOD_MISMATCH });

    }
    const passwordMatch = await bcrypt.compare(password.trim(), user.password);
    if (!passwordMatch) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: MESSAGES.INVALID_CREDENTIALS });
    }

    if (!user.isVerified) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: MESSAGES.EMAIL_NOT_VERIFIED});
    }

    if (user.isBlocked) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: MESSAGES.ACCOUNT_BLOCKED });
    }

    req.session.user_id = user._id;

    return res.status(HttpStatus.OK).json({ message: "Login successful" });
    // return res.redirect('/')
  } catch (error) {
    next(error);
  }
};

const googleAuth = async (req, res, next) => {
  try {
    if (req.user) {
      const existingUser = await User.findOne({ email: req.user.email });

      if (existingUser) {
        req.session.user_id = existingUser._id;
        return res.redirect("/home");
      } else {
        const user = new User({
          name: req.user.displayName,
          email: req.user.email,
          isVerified: true,
        });
        req.session.user_id = user._id;
        await user.save();
        return res.status(HttpStatus.OK).redirect("/home");
      }
    }
  } catch (error) {
    next(error);
  }
};

const googleFail = async (req, res, next) => {
  try {
    res.render("login", { message: "Google authentication failed" });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    req.session.destroy((error) => {
      if (error) {
        console.error("Error destroying session:", error);
        next(error);
      }
      res.redirect("/");
    });
  } catch (error) {
    next(error);
  }
};

// Home page
const loadHome = async (req, res, next) => {
  try {
    const products = await productDB
      .find({ listed: true })
      .populate({
        path: "variant",
        match: { variantListed: true },
      })
      .populate("categoryId"); // Adjust if you need filters or select specific fields

    res.render("index", { products });
  } catch (error) {
    next(error);
  }
};

const productDetail = async (req, res, next) => {
  try {
    const id = req.query.id;
    const variantId = req.query.variantId;

    if (!isValidObjectId(variantId)) {
      return res.redirect("/404error");
    }
    if (!isValidObjectId(id)) {
      return res.redirect("/404error");
    }

    const variant = await variantDB.findById(variantId).populate("productId");
    const product = await productDB.findById(id).populate({
      path: "variant",
      match: { variantListed: true },
    });
    if (!variant || !product) {
      return res.redirect("/404error");
    }

    const categoryId = product.categoryId;
    const otherProducts = await productDB
      .find({ categoryId: categoryId, listed: true })
      .populate({
        path: "variant",
        match: { variantListed: true },
      })
      .limit(4);

    res.render("product-detail", { variant, product, otherProducts });
  } catch (error) {
    next(error);
  }
};

const shopPage = async (req, res, next) => {
  try {
    const search = req.query.search || "";
    const sortBy = req.query.sortBy || "Default";
    const categoryName = req.query.categoryName || "";
    const size = req.query.size || "";
    const color = req.query.color || "";

    let query = { listed: true, productName: new RegExp(search, "i") };

    if (categoryName) {
      if (!isValidObjectId(categoryName)) {
        return res.redirect("/404error");
      }
      const category = await CategoryDB.findById(categoryName, { isListed: true });

      if (category) {
        query.categoryId = category._id;
      } else {
        console.log(`Category with name "${categoryName}" not found or is deleted.`);
      }
    }

    // Find all products matching the base query
    const productsQuery = await productDB
      .find(query)
      .populate({
        path: "variant",
        match: {
          variantListed: true,
          ...(size && { variantSizes: size }),
          ...(color && { variantColor: color }),
        },
      })
      .populate({
        path: "categoryId",
        match: { isListed: true },
      });

    // Filter out products with no matching variants after population
    const filteredProducts = productsQuery.filter((product) => product.variant.length > 0);

    // Sorting logic
    if (sortBy === "Price: Low to High") {
      filteredProducts.sort(
        (a, b) => a.variant[0].variantDiscountPrice - b.variant[0].variantDiscountPrice
      );
    } else if (sortBy === "Price: High to Low") {
      filteredProducts.sort(
        (a, b) => b.variant[0].variantDiscountPrice - a.variant[0].variantDiscountPrice
      );
    } else if (sortBy === "A-Z") {
      filteredProducts.sort((a, b) =>
        a.variant[0].variantName.localeCompare(b.variant[0].variantName)
      );
    } else if (sortBy === "Z-A") {
      filteredProducts.sort((a, b) =>
        b.variant[0].variantName.localeCompare(a.variant[0].variantName)
      );
    } else if (sortBy === "Newness") {
      filteredProducts.sort(
        (a, b) => new Date(b.variant[0].createdAt) - new Date(a.variant[0].createdAt)
      );
    }

    const categoryList = await CategoryDB.find({ isListed: true });

    if (req.xhr) {
      res.json(filteredProducts);
    } else {
      res.render("shop", { products: filteredProducts, categoryList });
    }
  } catch (error) {
    next(error);
  }
};

const myAccount = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findById(userId).populate("address");

    if (!user) {
      return res.status(HttpStatus.NOT_FOUND).redirect("/home");
    }

    res.render("accountDetails", { user, message: undefined });
  } catch (error) {
    next(error);
  }
};

const editProfile = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const { name, phone } = req.validatedBody;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: MESSAGES.ACCOUNT_NOT_FOUND });
    }
    parseInt(phone);
    await User.findByIdAndUpdate(userId, { name: name, phone });

    res.status(HttpStatus.OK).json({ message: "Profile updated successfully" });
  } catch (error) {
    next(error);
  }
};

const saveAddress = async (req, res, next) => {
  try {
    // const userId = req.params.id;
    const userId = req.session.user_id;
    const {
      userName,
      userAltPhone,
      userPIN,
      userLocality,
      userAddress,
      userCity,
      userState,
      userLandmark,
      addressType,
    } = req.validatedBody;

    const newAddress = {
      name: userName,
      altPhone: userAltPhone,
      pinCode: userPIN,
      locality: userLocality,
      address: userAddress,
      city: userCity,
      state: userState,
      landmark: userLandmark,
      addressType: addressType,
    };

    // Check if the address already exists for the user
    let addressDocument = await AddressDB.findOne({ userId: userId });

    if (addressDocument) {
      // Address document exists, update it by pushing the new address
      addressDocument.addresses.push(newAddress);
      await addressDocument.save();
    } else {
      // Create a new address document
      addressDocument = new AddressDB({
        userId: userId,
        addresses: [newAddress],
      });
      await addressDocument.save();
    }

    // Update the user's address reference
    await User.findByIdAndUpdate(userId, { address: addressDocument._id });

    res.status(HttpStatus.OK).json({ success: true, message: MESSAGES.ADDRESS_ADDED });
  } catch (error) {
    next(error);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const userId = req.session.user_id;

    if (!isValidObjectId(addressId)) {
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: MESSAGES.INVALID_REQUEST })
    }


    // Check if userId and addressId are provided
    if (!userId || !addressId) {
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: MESSAGES.INVALID_REQUEST });
    }

    // Find the address document by userId and update to pull the address
    const updatedAddress = await AddressDB.findOneAndUpdate(
      { userId },
      { $pull: { addresses: { _id: addressId } } },
      { new: true } // Return the updated document after update
    );

    if (!updatedAddress) {
      return res.status(HttpStatus.NOT_FOUND).json({ success: false, message: MESSAGES.ACCOUNT_NOT_FOUND });
    }

    if (updatedAddress.addresses.length === 0) {
      await User.findByIdAndUpdate(userId, { address: null });

      return res.status(HttpStatus.OK).json({ success: true, message: MESSAGES.LAST_ADDRESS_REMOVED });
    }

    res.status(HttpStatus.OK).json({ success: true, message: MESSAGES.ADDRESS_DELETED });
  } catch (error) {
    next(error);
  }
};

const editAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const userId = req.session.user_id;
    const {
      userName,
      userLocality,
      userAltPhone,
      userAddress,
      userLandmark,
      userCity,
      userState,
      userPIN,
      addressType,
    } = req.validatedBody;

    // Update the specific address using $ positional operator
    const updatedAddress = {
      "addresses.$.name": userName,
      "addresses.$.altPhone": userAltPhone,
      "addresses.$.pinCode": userPIN,
      "addresses.$.locality": userLocality,
      "addresses.$.address": userAddress,
      "addresses.$.city": userCity,
      "addresses.$.state": userState,
      "addresses.$.landmark": userLandmark,
      "addresses.$.addressType": addressType,
    };

    const result = await AddressDB.findOneAndUpdate(
      { userId, "addresses._id": addressId },
      { $set: updatedAddress },
      { new: true } // To return the updated document
    );

    if (!result) {
      return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: MESSAGES.ADDRESS_NOT_FOUND });
    }

    res.status(HttpStatus.OK).json({ success: true, message: MESSAGES.ADDRESS_UPDATED, data: result });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const { currentPassword, newPassword } = req.validatedBody;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.USER_NOT_FOUND,
      });
    }

    // If user has password 
    if (user.password) {
      const match = await bcrypt.compare(
        currentPassword.trim(),
        user.password
      );

      if (!match) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.PASSWORD_INCORRECT,
        });
      }
    }

    // Hash new password ONLY after verification
    const hashed = await securePassword(newPassword.trim())

    await User.findByIdAndUpdate(userId, { password: hashed });

    return res.status(200).json({
      success: true,
      message: MESSAGES.PASSWORD_UPDATED,
    });
  } catch (err) {
    next(err);
  }
};


const aboutPage = async (req, res, next) => {
  try {
    res.render("about");
  } catch (error) {
    next(error);
  }
};

const contactPage = async (req, res, next) => {
  try {
    res.render("contact");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loadHome,
  aboutPage,
  shopPage,
  productDetail,
  contactPage,
  registerPage,
  loginPage,
  insertUser,
  otpPage,
  verifyLogin,
  verifyOTP,
  resendOtp,
  googleAuth,
  googleFail,
  logout,
  myAccount,
  editProfile,
  saveAddress,
  deleteAddress,
  editAddress,
  changePassword,
};
