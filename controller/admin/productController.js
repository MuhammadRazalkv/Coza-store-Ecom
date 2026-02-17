const Category = require("../../model/categoryModel");
const Products = require("../../model/productModel");
const Variants = require("../../model/variantModel");
const OfferDB = require("../../model/offerModel");
const HttpStatus = require("../../constants/statusCode");
const MESSAGES = require("../../constants/messages");
const { default: mongoose } = require("mongoose");
const uploadToCloudinary = require("../../utils/fileUpload");

const loadProductPage = async (req, res, next) => {
  try {
    const limit = 6;
    const page = Math.max(1, parseInt(req.query.page)) || 1;
    const skip = (page - 1) * limit;

    const products = await Products.find()
      .populate("categoryId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const productCount = await Products.countDocuments();
    const totalPages = Math.ceil(productCount / limit);

    res.render("productList", { products: products, page, totalPages });
  } catch (error) {
    next(error);
  }
};

const loadAddProduct = async (req, res, next) => {
  try {
    const categories = await Category.find();
    res.render("addProduct", { categories, message: undefined });
  } catch (error) {
    next(error);
  }
};

const addProduct = async (req, res, next) => {
  try {
    const { productName, productDescription, productCategory, productBrand } = req.validatedBody;

    const existingProduct = await Products.findOne({
      productName: { $regex: new RegExp(`^${productName}$`, "i") },
    });

    if (existingProduct) {
      return res.status(HttpStatus.CONFLICT).json({ message: MESSAGES.PRODUCT_EXISTS });
    }
    const product = new Products({
      productName,
      description: productDescription,
      categoryId: productCategory,
      productBrand,
    });

    await product.save();
    return res.status(HttpStatus.CREATED).json({ message: MESSAGES.PRODUCT_ADDED });
  } catch (error) {
    next(error);
  }
};

const blockProduct = async (req, res, next) => {
  try {
    const { id } = req.validatedBody;

    const product = await Products.findById(id);
    if (!product) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: MESSAGES.PRODUCT_NOT_FOUND });
    }

    const updatedStatus = !product.listed;

    await Products.findByIdAndUpdate(id, { listed: updatedStatus });

    res.status(200).json({
      message: updatedStatus ? "Product listed" : "Product unlisted",
      listed: updatedStatus,
    });
  } catch (error) {
    next(error);
  }
};

const loadEditProduct = async (req, res, next) => {
  try {
    const id = req.query.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(HttpStatus.BAD_REQUEST).render("editProduct", {
        error: "Invalid product ID.",
        categories: null,
        product: null
      });
    }

    const categories = await Category.find({});
    const product = await Products.findById(id);
    if (!product) {
      return res.status(HttpStatus.NOT_FOUND).render("editProduct", {
        error: MESSAGES.PRODUCT_NOT_FOUND,
        categories: null,
        product: null
      });
    }
    res.render("editProduct", { categories, product, error: null });
  } catch (error) {
    next(error);
  }
};

const editProduct = async (req, res, next) => {
  try {
    const {
      id,
      productName,
      productCategory,
      productDescription,
      productBrand,
    } = req.validatedBody;

    const product = await Products.findById(id).populate("variant");
    if (!product) {
      return res.status(HttpStatus.NOT_FOUND).json({
        message: MESSAGES.PRODUCT_NOT_FOUND,
      });
    }
    await Products.findByIdAndUpdate(id, {
      $set: {
        productName: productName,
        description: productDescription,
        categoryId: productCategory,
        productBrand: productBrand,
      },
    });

    await Variants.updateMany({ productId: id }, { variantName: productName });

    await product.save();
    res.status(HttpStatus.OK).json({ success: true, redirect: "/admin/products-list" })
  } catch (error) {
    next(error);
  }
};

const loadProductDetails = async (req, res, next) => {
  try {
    const id = req.query.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(HttpStatus.BAD_REQUEST).render("productDetails", {
        product: null, variant: null, message: undefined, error: 'Invalid product ID'
      });
    }
    const product = await Products.findById(id).populate("categoryId");
    const variant = await Variants.find({ productId: id });
    if (!product) {
      return res.status(HttpStatus.NOT_FOUND).render("editProduct", {
        error: MESSAGES.PRODUCT_NOT_FOUND,
        product, variant, message: undefined,
      });
    }


    res.render("productDetails", { product, variant, message: undefined, error: null });
  } catch (error) {
    next(error);
  }
};

const loadAddVariant = async (req, res, next) => {
  try {
    const id = req.query.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(HttpStatus.BAD_REQUEST).render("addVariant", {
        product: null,
        variant: null,
        message: undefined,
        error: 'Invalid product ID'
      });
    }

    const product = await Products.findById(id).populate("categoryId").populate("variant");
    if (!product) {
      return res.status(HttpStatus.NOT_FOUND).render("addVariant", {
        product: null,
        variant: null,
        message: undefined, error: MESSAGES.PRODUCT_NOT_FOUND
      });
    }

    res.render("addVariant", {
      product,
      variant: product.variant,
      message: undefined,
      error: null
    });
  } catch (error) {
    next(error);
  }
};

const addVariant = async (req, res, next) => {
  try {
    const {
      variantColor,
      variantPrice,
      productId,
      sizes
    } = req.validatedBody;

    const files = [
      req.files?.variantImg1?.[0],
      req.files?.variantImg2?.[0],
      req.files?.variantImg3?.[0],
    ].filter(Boolean);

    if (files.length !== 3) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: MESSAGES.THREE_IMAGES_REQUIRED });
    }

    const product = await Products.findById(productId).populate("categoryId");

    if (!product) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: MESSAGES.PRODUCT_NOT_FOUND })
    }

    const existingVariant = await Variants.findOne({
      variantColor: { $regex: new RegExp(`^${variantColor}$`, "i") },
      productId,
    });

    if (existingVariant) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: MESSAGES.DUPLICATE_VARIANT });
    }

    const uploads = await Promise.all(
      files.map(file => uploadToCloudinary(file.buffer))
    );
    const imageUrls = uploads.map(u => u.secure_url);

    const variantName = `${product.productName}`.trim();

    let variant = new Variants({
      variantName,
      variantColor,
      variantPrice,
      variantImg: imageUrls,
      productId,
      sizes
    });

    await Products.findByIdAndUpdate(
      productId,
      { $push: { variant: variant._id } },
      { new: true, useFindAndModify: false }
    );


    const offer = await OfferDB.findOne({ categoryId: product.categoryId._id });
    if (offer) {
      let categoryOffer = {
        offerId: offer._id,
        discountPercentage: offer.discountPercentage,
        listed: offer.listed,
      };
      variant.categoryOffer = categoryOffer;
    }
    const productOffer = await OfferDB.findOne({ productId: product._id });
    if (productOffer) {
      let prOffer = {
        offerId: productOffer._id,
        discountPercentage: productOffer.discountPercentage,
        listed: productOffer.listed,
      };
      variant.productOffer = prOffer;
    }

    await variant.save();

    return res.status(200).json({ message: "Variant added successfully" });
  } catch (error) {
    next(error);
  }
};

const loadEditVariant = async (req, res, next) => {
  try {
    const id = req.query.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(HttpStatus.BAD_REQUEST).render("editVariant", {
        variant: null,
        message: undefined,
        error: 'Invalid variant ID'
      });
    }

    const variant = await Variants.findById(id);
    if (!variant) {
      return res.redirect("/products-list");
    }
    console.log('Variant ', variant);

    res.render("editVariant", { variant, message: undefined, error: null });
  } catch (error) {
    next(error);
  }
};

const editVariant = async (req, res, next) => {
  try {
    const { variantColor,
      variantPrice,
      sizes,
      variantId } = req.validatedBody;

    const fileEntries = [
      { index: 0, file: req.files?.variantImg1?.[0] },
      { index: 1, file: req.files?.variantImg2?.[0] },
      { index: 2, file: req.files?.variantImg3?.[0] },
    ].filter(entry => entry.file);



    const currentVariant = await Variants.findById(variantId);
    if (!currentVariant) {
      return res.status(HttpStatus.NOT_FOUND).json({ success: false, message: MESSAGES.VARIANT_NOT_FOUND })
    }

    const productId = currentVariant.productId._id;
    // console.log('p',productId);

    const existingVariant = await Variants.findOne({
      productId: productId,
      variantColor: { $regex: new RegExp(`^${variantColor}$`, "i") },
      _id: { $ne: variantId },
    });

    if (existingVariant) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: MESSAGES.VARIANT_EXISTS });
    }
    let imagePaths = [...currentVariant.variantImg];

    if (fileEntries.length) {
      const uploads = await Promise.all(
        fileEntries.map(async ({ index, file }) => {
          const uploaded = await uploadToCloudinary(file.buffer);
          return { index, url: uploaded.secure_url };
        })
      );

      for (const { index, url } of uploads) {
        imagePaths[index] = url;
      }
    }



    await Variants.findByIdAndUpdate(variantId, { $set: { variantColor, sizes, variantPrice, variantImg: imagePaths } });
    res.status(200).json({ message: "Variant updated successfully" });
  } catch (error) {
    next(error);
  }
};

const blockUnblockVariant = async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: "Variant not found" });
    }

    const variant = await Variants.findById(id);

    if (!variant) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: "Variant not found" });
    }
    const updatedStatus = !variant.variantListed;

    await Variants.findByIdAndUpdate(id, { variantListed: updatedStatus });

    return res.status(200).json({
      message: variant.variantListed
        ? "Variant unlisted successfully"
        : "Variant listed successfully",
      listed: updatedStatus,
    });
  } catch (error) {
    next(error);
  }
};

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
  blockUnblockVariant,
};
