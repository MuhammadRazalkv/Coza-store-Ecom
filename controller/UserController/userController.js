const User = require('../../model/userModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const OTP = require('../../model/otpModel')
const otpGenerator = require('otp-generator')
const mailSender = require('../../utils/mailSender')
const PendingUser = require('../../model/pendingUserModel')
const productDB = require('../../model/productModel')
const CategoryDB = require('../../model/categoryModel')

const variantDB = require('../../model/variantModel')
const AddressDB = require('../../model/addressModal')
const { name } = require('ejs')

//User Authentication
const { ObjectId } = require('mongodb')

function isValidObjectId (id) {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id
}
const errorPage = async (req,res)=>{
  try {
    return res.render('/404error',{message:undefined})
  } catch (error) {
    console.log('err in errorPage',error);
  }
}

const registerPage = async (req, res,next) => {
  try {
    res.render('register')
  } catch (error) {
    next(error)
  }
}

const securePassword = async password => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    return hashedPassword
  } catch (error) {
    throw error
  }
}

//* Generating random OTP

const generateOTP = () => {
  return otpGenerator.generate(4, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false
  })
}

const insertUser = async (req, res,next) => {
  try {
    const sPassword = await securePassword(req.body.password)
    const { name, email, phone } = req.body

    const existingUser = await User.findOne({ email: email })
    if (existingUser) {
      return res.render('register', { message: 'Email already exists' })
    }

    const otp = generateOTP()
   

    const pendingUser = new PendingUser({
      name: name.trim(),
      email: email,
      mobile: phone,
      password: sPassword,
      otp: otp,
      otpExpires: Date.now() + 1 * 60 * 1000 // OTP expires in 1 minutes
    })

    await pendingUser.save()
    await mailSender(email, otp)

    return res.redirect(`/otpVerification?email=${email}`)
  } catch (error) {
    next(error)
  }
}

const otpPage = async (req, res,next) => {
  try {
    const { email } = req.query
    res.render('otp', { email: email })
  } catch (error) {
    next(error)
  }
}
  
const resendOtp = async (req, res,next) => {
  try {
    const email = req.query.email
    if (!email) {
      return res.render('register', { message: 'Email not found' })
    }

    const pendingUser = await PendingUser.findOne({ email: email })
    if (!pendingUser) {
      return res.render('register', { message: 'User not found' })
    }

    const otp = generateOTP()
   

    pendingUser.otp = otp
    pendingUser.otpExpires = Date.now() + 1 * 60 * 1000 // Reset OTP expiry time

    await pendingUser.save()
    await mailSender(email, otp)

    return res.redirect(`/otpVerification?email=${email}`)
  } catch (error) {
    next(error)
  }
}

const verifyOTP = async (req, res,next) => {
  try {
    // const { otp1, otp2, otp3, otp4 } = req.body
    // const otp = otp1 + otp2 + otp3 + otp4
    const {otp} = req.body
    const { email } = req.query

    const pendingUser = await PendingUser.findOne({ email: email })

    if (!pendingUser) {
      return res.render('otp', { message: 'Invalid OTP or OTP has expired' })
    }

    if (otp === pendingUser.otp && pendingUser.otpExpires > Date.now()) {
      const user = new User({
        name: pendingUser.name,
        email: pendingUser.email,
        mobile: pendingUser.mobile,
        password: pendingUser.password,
        joinedDate: pendingUser.joinedDate,
        isAdmin: false,
        isBlocked: false,
        isVerified: true
      })

      req.session.user_id = user._id
      await user.save()
      await PendingUser.deleteOne({ email: email })

      return res.redirect('/')
    } else {
      return res.render('otp', { success: false, message: 'Invalid OTP' })
    }
  } catch (error) {
    next(error)
  }
}

const loginPage = async (req, res,next) => {
  try {
    res.render('login')
  } catch (error) {
    next(error)
  }
}

const verifyLogin = async (req, res,next) => {
  try {
    const { email, password } = req.body
    //  console.log('pass',password);
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ error: 'Invalid Email or Password' })
    }
   
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Invalid Email or Password' })
    }

    if (!user.isVerified) {
      return res.status(400).json({ error: 'Email is not verified' })
    }

    if (user.isBlocked) {
      return res
        .status(400)
        .json({ error: 'You are not allowed to login, Please contact us' })
    }
    

    req.session.user_id = user._id

     return res.status(200).json({ message: 'Login successful' })
   // return res.redirect('/')
  } catch (error) {
    next(error)
  }
}

const googleAuth = async (req, res,next) => {
  try {
    if (req.user) {
      const existingUser = await User.findOne({ email: req.user.email })

      if (existingUser) {
        req.session.user_id = existingUser._id
        return res.redirect('/home')
      } else {
        const user = new User({
          name: req.user.displayName,
          email: req.user.email,
          isVerified: true
        })
        req.session.user_id = user._id
        await user.save()
        return res.status(200).redirect('/home')
      }
    }
  } catch (error) {
    next(error)
  }
}

const googleFail = async (req, res,next) => {
  try {
    res.render('login', { message: 'Google authentication failed' })
  } catch (error) {
    next(error)
  }
}

const logout = async (req, res,next) => {
  try {
    req.session.destroy(error => {
      if (error) {
        console.error('Error destroying session:', err)
        next(error)
      }
      res.redirect('/')
    })
  } catch (error) {
    next(error)
  }
}

// Home page
const loadHome = async (req, res,next) => {
  try {
   
    const products = await productDB.find({ listed: true })
    .populate({
        path: 'variant',
        match: { variantListed: true }
    })
    .populate('categoryId');  // Adjust if you need filters or select specific fields


    res.render('index', { products })
  } catch (error) {
    next(error)
  }
}
 
const productDetail = async (req, res,next) => {
  try {
    const id = req.query.id    
    const variantId = req.query.variantId
    
   
    if (!isValidObjectId(variantId)) {
      return res.redirect('/404error')
    }
    if (!isValidObjectId(id)) {
      return res.redirect('/404error')
    }

    const variant = await variantDB.findById(variantId).populate('productId')
    const product = await productDB.findById(id).populate({
      path: 'variant',
      match: { variantListed: true }
    })
    if (!variant || !product) {
      return res.redirect('/404error')
    }

    const categoryId = product.categoryId 
    const otherProducts = await productDB.find({categoryId:categoryId , listed:true})
    .populate({
      path: 'variant',
      match: { variantListed: true }
    })
    .limit(4)
   
    
    res.render('product-detail', { variant, product , otherProducts })

  } catch (error) {
    next(error)
  }
}




const shopPage = async (req, res,next) => {
  try {
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'Default';
    const categoryName = req.query.categoryName || '';
    const size = req.query.size || '';
    const color = req.query.color || '';

    let query = { listed: true, productName: new RegExp(search, 'i') };
   
   
    if (categoryName) {
      if (!isValidObjectId(categoryName)) {
        return res.redirect('/404error')
      }
      const category = await CategoryDB.findById(categoryName, { isDeleted: true });
   
      if (category) {
        query.categoryId = category._id;
      } else {
        console.log(`Category with name "${categoryName}" not found or is deleted.`);
      }
    }

    // Find all products matching the base query
    const productsQuery = await productDB.find(query)
      .populate({
        path: 'variant',
        match: { 
          variantListed: true,
          ...(size && { variantSizes: size }),
          ...(color && { variantColor: color })
        }
      })
      .populate({
        path: 'categoryId',
        match: { isDeleted: true }
      });

    // Filter out products with no matching variants after population
    const filteredProducts = productsQuery.filter(product => product.variant.length > 0);

    // Sorting logic
    if (sortBy === 'Price: Low to High') {
      filteredProducts.sort((a, b) => a.variant[0].variantDiscountPrice - b.variant[0].variantDiscountPrice);
    } else if (sortBy === 'Price: High to Low') {
      filteredProducts.sort((a, b) => b.variant[0].variantDiscountPrice - a.variant[0].variantDiscountPrice);
    } else if (sortBy === 'A-Z') {
      filteredProducts.sort((a, b) => a.variant[0].variantName.localeCompare(b.variant[0].variantName));
    } else if (sortBy === 'Z-A') {
      filteredProducts.sort((a, b) => b.variant[0].variantName.localeCompare(a.variant[0].variantName));
    } else if (sortBy === 'Newness') {
      filteredProducts.sort((a, b) => new Date(b.variant[0].createdAt) - new Date(a.variant[0].createdAt));
    }

    const categoryList = await CategoryDB.find({ isDeleted: true });

    if (req.xhr) {
      res.json(filteredProducts);
    } else {
      res.render('shop', { products: filteredProducts, categoryList });
    }
  } catch (error) {
    next(error)
  }
};


const myAccount = async (req, res,next) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findById(userId).populate('address');
  
    if (!user) {
   
      return res.status(404).redirect('/home');
    }
  
  
    res.render('accountDetails', { user, message: undefined });
  } catch (error) {
    next(error)
  }
}

const editProfile = async (req, res,next) => {
  try {
    const id = req.params.id
    const { name, phone } = req.body
    //  console.log('body',req.body);

    parseInt(phone)

    const user = await User.findById(id)
    if (!user) {
      return res
        .status(404)
        .json({ message: 'User not found Please try again later ' })
    }
    await User.findByIdAndUpdate(id, { name: name, mobile: phone })

    res.status(200).json({ message: 'Profile updated successfully' })
  } catch (error) {
    next(error)
  }
}

const saveAddress = async (req, res,next) => {
  try {
    // const userId = req.params.id;
    const userId = req.session.user_id
    const {
      userName, userAltPhone, userPIN, userLocality,
      userAddress, userCity, userState, userLandmark, addressType
    } = req.body;

    const newAddress = {
      name: userName,
      altPhone: userAltPhone,
      pinCode: userPIN,
      locality: userLocality,
      address: userAddress,
      city: userCity,
      state: userState,
      landmark: userLandmark,
      addressType: addressType
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
        addresses: [newAddress]
      });
      await addressDocument.save();
    }

    // Update the user's address reference
    await User.findByIdAndUpdate(userId, { address: addressDocument._id });

    res.status(200).json({ success: true, message: 'Address added successfully' });
  } catch (error) {
    next(error)
  }
};



const deleteAddress = async (req, res,next) => {
  try {
      const { userId, addressId } = req.params;

      // Check if userId and addressId are provided
      if (!userId || !addressId) {
          return res.status(400).json({ success: false, message: 'Invalid parameters' });
      }

      // Find the address document by userId and update to pull the address
      const updatedAddress = await AddressDB.findOneAndUpdate(
          { userId: userId },
          { $pull: { addresses: { _id: addressId } } },
          { new: true } // Return the updated document after update
      );

      if (!updatedAddress) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    
    if (updatedAddress.addresses.length === 0) {
        
        await User.findByIdAndUpdate(userId, { address: null });

        return res.status(200).json({ success: true, message: 'Last address deleted successfully' });
    }

      res.status(200).json({ success: true, message: 'Address deleted successfully' });

  } catch (error) {
    next(error)
  }
};


const editAddress = async (req, res,next) => {
  try {
    const { userId, addressId } = req.params;
    const {
      userName,
      userLocality,
      userAltPhone,
      userAddress,
      userLandmark,
      userCity,
      userState,
      userPIN,
      addressType
    } = req.body;

    // Update the specific address using $ positional operator
    const updatedAddress = {
      'addresses.$.name': userName,
      'addresses.$.altPhone': userAltPhone,
      'addresses.$.pinCode': userPIN,
      'addresses.$.locality': userLocality,
      'addresses.$.address': userAddress,
      'addresses.$.city': userCity,
      'addresses.$.state': userState,
      'addresses.$.landmark': userLandmark,
      'addresses.$.addressType': addressType
    };

    const result = await AddressDB.findOneAndUpdate(
      { userId, 'addresses._id': addressId },
      { $set: updatedAddress },
      { new: true } // To return the updated document
    );

    if (!result) {
      return res.status(400).json({ success: false, message: 'Address not found' });
    }

    res.status(200).json({ success: true, message: 'Address updated successfully', data: result });
  } catch (error) {
    next(error)
  }
};


const changePassword = async (req, res,next) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    const { password, newPassword, rePassword } = req.body;

    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password, try again' });
    }

    if (newPassword !== rePassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    // Ensure securePassword is a function that securely hashes the password
    let sPassword = await securePassword(newPassword);
    await User.findByIdAndUpdate(userId, { password: sPassword });

    return res.status(200).json({ success: true, message: 'Password updated successfully' });

  } catch (error) {
    next(error)
  }
};




const aboutPage = async (req, res,next) => {
  try {
    res.render('about')
  } catch (error) {
    next(error)
  }
}

const contactPage = async (req, res,next) => {
  try {
    res.render('contact')
  } catch (error) {
    next(error)
  }
}

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
  changePassword
}
