const express = require('express')
const User = require('../../model/userModel')
const bcrypt = require('bcrypt')
const Category = require('../../model/categoryModel')
const Products = require('../../model/productModel')
const Variants = require('../../model/variantModel')
const { name } = require('ejs')

const loadProductPage = async (req, res,next) => {
  try {

    const limit = 6;
    const page = Math.max(1, parseInt(req.query.page)) || 1;
    const skip = (page - 1) * limit;

    const products = await Products.find().populate('categoryId').sort({createdAt:-1}).skip(skip).limit(limit)
    const productCount = await Products.countDocuments()
    const totalPages = Math.ceil(productCount / limit);


    res.render('productList', { products: products , page , totalPages })
  } catch (error) {
    next(error)
  }
}

const loadAddProduct = async (req, res , next) => {
  try {
    const categories = await Category.find()
    res.render('addProduct', { categories, message: undefined })
  } catch (error) {
    next(error)
  }
}

const addProduct = async (req, res,next) => {
  try {

    
    const { productName, productDescription, productCategory, productBrand } =
     req.body
   // console.log('body',req.body);

    const nameRegex = /^[a-zA-Z0-9 ]+$/
    if (!nameRegex.test(productName)) {
      return res.status(400).json({
        message:
          'Product name contains invalid characters. Only letters, numbers, and spaces are allowed.'
      })
    }

    const product = new Products({
      productName,
      description: productDescription,
      categoryId: productCategory,
      productBrand: productBrand
    })

    const existingProduct = await Products.findOne({
      productName: { $regex: new RegExp(`^${productName}$`, 'i') }
    })

    if (existingProduct) {
      return res.status(409).json({ message: 'Product Name is Already taken' })
    }

    await product.save()
    return res.status(201).json({ message: 'Product added successfully' })
  } catch (error) {
    next(error)
  }
}


const blockProduct = async (req, res,next) => {
  try {
    const { id } = req.body
    if (!id) {
      res.status(400).json({ message: 'Product Not found' })
    }
    const product = await Products.findById(id)
    if (!product) {
      res.status(400).json({ message: 'Product Not found' })
    }

    const updatedStatus = !product.listed

    await Products.findByIdAndUpdate(id, { listed: updatedStatus })

    res.status(200).json({
      message: updatedStatus ? 'Product listed' : 'Product unlisted',
      listed: updatedStatus
    })
  } catch (error) {
    next(error)
  }
}

const loadEditProduct = async (req, res,next) => {
  try {
    const categories = await Category.find({})
    const id = req.query.id
    //console.log(id);
    const product = await Products.findById(id)

    res.render('editProduct', { categories, product })
  } catch (error) {
    next(error)
  }
}

const editProduct = async (req, res,next) => {
  try {
    const {
      id,
      productName,
      productCategory,
     
      productDescription,
      productBrand
    } = req.body

    const product = await Products.findById(id).populate('variant');

    await Products.findByIdAndUpdate(id, {
      $set: {
        productName: productName,
        description: productDescription,
        categoryId: productCategory,
        productBrand: productBrand
      }
    })

    await Variants.updateMany({productId:id},
         {variantName:productName})
   
  

    await product.save();

   
    res.redirect('/admin/products-list')
  } catch (error) {
    next(error)
  }
}


const loadProductDetails = async (req, res,next) => {
  try {
    const id = req.query.id
    const product = await Products.findById(id).populate('categoryId')
    const variant = await Variants.find({productId:id})
   
    res.render('productDetails', { product, variant, message: undefined })
  } catch (error) {
    next(error)
  }
}

const loadAddVariant = async (req, res,next) => {
  try {
    const id = req.query.id
    const product = await Products.findById(id)
      .populate('categoryId')
      .populate('variant')
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    res.render('addVariant', {
      product,
      variant: product.variant,
      message: undefined
    })
  } catch (error) {
    next(error)
  }
}

const addVariant = async (req, res,next) => {
  try {
    const {
      productName,
      variantColor,
      variantPrice,
      variantDiscountPrice,
      variantStock,
      sizesInput,
      productId
    } = req.body
    //  console.log(req.body);

    const files = req.files || {}

    //   console.log('sizesInput',sizesInput);

    let imagePaths = [
      req.body.currentImage1,
      req.body.currentImage2,
      req.body.currentImage3
    ]

    if (files.variantImg1) imagePaths[0] = files.variantImg1[0].filename
    if (files.variantImg2) imagePaths[1] = files.variantImg2[0].filename
    if (files.variantImg3) imagePaths[2] = files.variantImg3[0].filename

    let sizes
    try {
      sizes = JSON.parse(sizesInput)
      // console.log('Parsed sizes:', sizes);
    } catch (error) {
      console.error('Error parsing sizesInput:', error)
      return res.status(400).json({ message: 'Invalid sizes input' })
    }

    if (sizes.length === 0) {
      return res
        .status(400)
        .json({ message: 'Please select at least one size' })
    }

    let sizesArray = sizes.filter(size => ['S', 'M', 'L', 'XL'].includes(size))
    // console.log('Validated sizesArray:', sizesArray);

    const existingVariant = await Variants.findOne({
      variantColor: { $regex: new RegExp(`^${variantColor}$`, 'i') },
      productId
    });
    

    if (existingVariant) {
      return res.status(400).json({ message: 'This variant color already exists' })
    }

    // const variantName = `${productName} - ${variantColor}`.trim()
    const variantName = `${productName}`.trim()
    const variant = new Variants({
      variantName,
      variantColor,
      variantStock,
      variantPrice,
      variantDiscountPrice,
      variantListed: true,
      variantSizes: sizesArray,
      variantImg: imagePaths,
      productId: productId
    })
        // Update the product to include the new variant
        await Products.findByIdAndUpdate(
          productId,
          { $push: { variant: variant._id } },
          { new: true, useFindAndModify: false }
        );
    

    await variant.save()

    return res.status(200).json({ message: 'Variant added successfully' })
  } catch (error) {
    next(error)
  }
}

const loadEditVariant = async (req, res,next) => {
  try {
    const id = req.query.id
    if (!id) {
  
      return res.status(400).json({message:'Variant not found'})
    } 

  

    const variant = await Variants.findById(id).populate('productId')
    if(!variant){
      return res.redirect('/products-list')
    }

    res.render('editVariant', { variant, message: undefined })
  } catch (error) {
    next(error)
  }
}


const editVariant = async (req, res,next) => {
  
    try {
      const id = req.params.id;
    // console.log('id',id);
      const updates = req.body;
      const files = req.files || {};
  
      let imagePaths = [
        req.body.currentImage1,
        req.body.currentImage2,
        req.body.currentImage3
      ];
  
      if (files.variantImg1) imagePaths[0] = files.variantImg1[0].filename;
      if (files.variantImg2) imagePaths[1] = files.variantImg2[0].filename;
      if (files.variantImg3) imagePaths[2] = files.variantImg3[0].filename;
  
      let sizes;
      try {
        sizes = JSON.parse(req.body.sizesInput || '[]');
      } catch (error) {
       
        return res.status(400).json({ message: 'Invalid sizes input' });
      }
  
      if (sizes.length === 0) {
        return res.status(400).json({ message: 'Please select at least one size' });
      }
  
      let sizesArray = sizes.filter(size => ['S', 'M', 'L', 'XL'].includes(size));
        
      const currentVariant = await Variants.findById(id);
    //  console.log('c',currentVariant);

      const productId = currentVariant.productId._id;
    // console.log('p',productId);

      const existingVariant = await Variants.findOne({
        productId: productId,
        variantColor: { $regex: new RegExp(`^${updates.variantColor}$`, 'i') },
        _id: { $ne: id } // Exclude the current variant from the check
      });
  
      if (existingVariant) {
        return res.status(400).json({message: ' This variant color already exists' })
      }

      let updateFields = {
        variantImg: imagePaths
      };
  
      if (updates.variantColor) updateFields.variantColor = updates.variantColor;
      if (updates.variantPrice) updateFields.variantPrice = updates.variantPrice;
      if (updates.variantDiscountPrice) updateFields.variantDiscountPrice = updates.variantDiscountPrice;
      if (updates.variantStock) updateFields.variantStock = updates.variantStock;
      if (sizesArray.length > 0) updateFields.variantSizes = sizesArray;
  
      await Variants.findByIdAndUpdate(id, { $set: updateFields });
      res.status(200).json({ message: 'Variant updated successfully' });

  } catch (error) {
    next(error)
  }
}


const blockUnblockVariant = async (req,res,next)=>{
   try {
    const {id} = req.body
    if (!id) {
      return res.status(400).json({message:'Variant not found'})
    }

    const variant = await Variants.findById(id)
    
    if (!variant) {
      return res.status(400).json({message:'Variant not found'})
    }
    const updatedStatus = !variant.variantListed
     
   await Variants.findByIdAndUpdate(id,{variantListed:updatedStatus})

   return res.status(200).json({
    message:variant.variantListed ? 'Variant unlisted successfully' : 'Variant listed successfully',
    listed:updatedStatus
   })
   
  
   } catch (error) {
    next(error)
   }


}




module.exports = {
  loadProductPage,
  loadAddProduct,
  addProduct,
  blockProduct,
  loadEditProduct,
  editProduct,
  loadProductDetails,
  loadAddVariant,
  addVariant,
  loadEditVariant,
  editVariant,
  blockUnblockVariant
}
