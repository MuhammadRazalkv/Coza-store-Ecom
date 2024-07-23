const express = require('express')
const User = require('../../model/userModel')
const bcrypt = require('bcrypt')
const Category = require('../../model/categoryModel')
const Products = require('../../model/productModel')
const OrderDB = require('../../model/orderModal')

const registerPage = async (req, res,next) => {
  try {
    res.render('adminLogin')
  } catch (error) {
    // console.error('Error loading register page:', error)
    // res.status(500).send('Server Error')
    next(error)
  }
}

const verifyLogin = async (req, res,next) => {
  try {
    const { email, password } = req.body

    const admin = await User.findOne({ email: email })

    if (!admin) {
      return res.render('adminLogin', { message: 'Invalid Email or Password' })
    }

    const passwordMatch = await bcrypt.compare(password, admin.password)

    if (!passwordMatch) {
      return res.render('adminLogin', { message: 'Invalid Email or Password' })
    }

    if (admin.isAdmin == false) {
      return res.render('adminLogin', { message: 'Invalid Email or Password' })
    }
    req.session.admin_id = admin._id

    return res.redirect('/admin/home')
  } catch (error) {
  
    next(error)
  }
}

const logout = async (req, res,next) => {
  try {
    req.session.destroy()
    return res.redirect('/admin')
  } catch (error) {
   next(error)
  }
}

const loadHome = async (req, res,next) => {
  try {
    const filter = req.query.filter || 'All'

    let matchCondition = { 'orderItems.cancelledOrRefunded': false }

    if (filter === 'daily') {
      const today = new Date()
      matchCondition.orderDate = {
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lt: new Date(today.setHours(23, 59, 59, 999))
      }
    } else if (filter === 'weekly') {
      const today = new Date()
      const firstDayOfWeek = new Date(
        today.setDate(today.getDate() - today.getDay())
      )
      const lastDayOfWeek = new Date(
        today.setDate(today.getDate() - today.getDay() + 6)
      )
      matchCondition.orderDate = {
        $gte: new Date(firstDayOfWeek.setHours(0, 0, 0, 0)),
        $lt: new Date(lastDayOfWeek.setHours(23, 59, 59, 999))
      }
    } else if (filter === 'yearly') {
      const thisYear = new Date().getFullYear()
      matchCondition.orderDate = {
        $gte: new Date(thisYear, 0, 1),
        $lt: new Date(thisYear, 11, 31, 23, 59, 59, 999)
      }
    } else if (filter === 'monthly') {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()

      matchCondition.orderDate = {
        $gte: new Date(year, month, 1),
        $lt: new Date(year, month + 1, 1)
      }
    }

    let productSales = await OrderDB.aggregate([
      { $unwind: '$orderItems' },
      { $match: matchCondition },
      {
        $group: {
          _id: '$orderItems.variantName',
          totalSold: { $sum: '$orderItems.quantity' },
          productName: { $first: '$orderItems.variantName' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 6 }
    ])

    let xValues = productSales.map(item => item.productName)
    let yValues = productSales.map(item => item.totalSold)

    let products = await OrderDB.aggregate([
      { $unwind: '$orderItems' },
      { $match: { 'orderItems.cancelledOrRefunded': false } },
      {
        $group: {
          _id: '$orderItems.variantName',
          totalSold: { $sum: '$orderItems.quantity' },
          productName: { $first: '$orderItems.variantName' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ])

    const topCategories = await OrderDB.aggregate([
      { $unwind: '$orderItems' },
      { $match: { 'orderItems.cancelledOrRefunded': false } },
      {
        $group: {
          _id: '$orderItems.categoryName',
          totalSold: { $sum: '$orderItems.quantity' },
          categoryName: { $first: '$orderItems.categoryName' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ])

    const topBrands = await OrderDB.aggregate([
      { $unwind: '$orderItems' },
      { $match: { 'orderItems.cancelledOrRefunded': false } },

      {
        $lookup: {
          from: 'products',
          localField: 'orderItems.productId',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },

      {
        $group: {
          _id: '$productDetails.productBrand',
          totalSold: { $sum: '$orderItems.quantity' },
          brandName: { $first: '$productDetails.productBrand' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ])

    const userCount = await User.countDocuments({ isAdmin: false })
    const orderCount = await OrderDB.countDocuments()
    const productCount = await Products.countDocuments()
    const categoryCount = await Category.countDocuments()

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      res.json({ xValues, yValues })
    } else {
      res.render('home', {
        xValues,
        yValues,
        message: undefined,
        products,
        topCategories,
        topBrands,
        userCount,
        orderCount,
        productCount,
        categoryCount
      })
    }
  } catch (error) {
   next(error)
  }
}

const userManagement = async (req, res,next) => {
  try {
    const limit = 10
    const page = Math.max(1, parseInt(req.query.page)) || 1
    const skip = (page - 1) * limit

    const userData = await User.find({ isAdmin: false }).skip(skip).limit(limit)
    const userCount = await User.countDocuments({ isAdmin: false })
    const totalPages = Math.ceil(userCount / limit)

    res.render('userList', {
      user: userData,
      message: undefined,
      page,
      totalPages
    })
  } catch (error) {
  next(error)
  }
}

const blockUnblock = async (req, res,next) => {
  const { id } = req.body

  try {
    if (!id) {
      return res.status(400).json({ message: 'User not found' })
    }

    const user = await User.findById(id)

    if (!user) {
      return res.status(400).json({ message: 'User not found' })
    }

    const updatedStatus = !user.isBlocked

    const userStatus =  await User.findByIdAndUpdate(id, { isBlocked: updatedStatus })
   
    if (userStatus.isBlocked == true) {
      
    }


    return res.status(200).json({
      message: updatedStatus
        ? 'User blocked successfully'
        : 'User unblocked successfully',
      listed: updatedStatus
    })
  } catch (error) {
 next(error)
  }
}

const categoryManagement = async (req, res,next) => {
  try {
    const categories = await Category.find({})

    res.render('categoryManagement', { categories })
  } catch (error) {
    next(error)
  }
}

const loadAddCategory = async (req, res,next) => {
  try {
    res.render('addCategory')
  } catch (error) {
    next(error)
  }
}

const addCategory = async (req, res , next) => {
  try {
    const { name, description } = req.body
    const categories = await Category.find({ name: name })
    if (categories) {
      return res
        .status(400)
        .json({ success: false, message: 'Category already exists' })
    }
    const newCategory = new Category({ name, description })
    await newCategory.save()
    res.redirect('/admin/category-list')
  } catch (error) {
    next(error)
  }
}

const loadEditCategory = async (req, res ,next) => {
  try {
    const id = req.query.id

    const categories = await Category.findById({ _id: id })

    res.render('editCategory', { categories })
  } catch (error) {
    next(error)
  }
}

const editCategory = async (req, res,next) => {
  try {
    const { id, name, description } = req.body

    const regexName = new RegExp(name, 'i');
    console.log('name',name);
    console.log('r',regexName);
    const existingCategory = await Category.findOne({
      name: regexName,
      _id: { $ne: id }
    });
   
    if (existingCategory) {
      return res.status(400).json({message:'Category name already exists '})
    }
    
    await Category.findByIdAndUpdate(
      { _id: id },
      {
        $set: {
          name: name,
          description: description
        }
      }
    )
    return res.status(200).json({message:'Category updated successfully'})
  } catch (error) {
    next(error)
  }
}

const softDeleteCategory = async (req, res , next) => {
  try {
    const { id } = req.body

    if (!id) {
      return res.status(400).json({ message: 'Category not found' })
    }

    //await Category.findByIdAndUpdate({_id:id},{isDeleted:true})
    const category = await Category.findOne({ _id: id })
    if (!category) {
      return res.status(400).json({ message: 'Category not found' })
    }
    const updatedStatus = !category.isDeleted

    await Category.findByIdAndUpdate(id, { isDeleted: updatedStatus })

    // if (category.isDeleted === false) {
    //   await Category.findByIdAndUpdate({ _id: id }, { isDeleted: true })
    // } else {
    //   await Category.findByIdAndUpdate({ _id: id }, { isDeleted: false })
    // }

    // res.redirect('/admin/category-list')
    return res.status(200).json({
      message: category.isDeleted
        ? 'Category unlisted successfully'
        : 'Category listed successfully',
      listed: updatedStatus
    })
  } catch (error) {
    next(error)
  }
}

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
  logout
}
