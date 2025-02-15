const express = require('express')
const User = require('../../model/userModel')
const bcrypt = require('bcrypt')
const Category = require('../../model/categoryModel')
const Products = require('../../model/productModel')
const CouponDB = require('../../model/couponModal')

const loadCouponPage = async (req,res,next)=>{
    try {
        const coupons = await CouponDB.find().sort({createdAt:-1})

        res.render('couponsManagement',{coupons})
    } catch (error) {
        next(error)
    }
}

const loadAddCoupon = async (req,res,next)=>{
    try {

        res.render('addCoupon')
        
    } catch (error) {
        next(error)
    }
}


const addCoupon = async (req, res,next) => {
    try {
        const {
            couponName,
            couponCode,
            minimumPurchaseAmount,
            discountPercentage,
            maxRedeemAmount,
            expiryDate
        } = req.body;

        if (couponName == '' || couponCode == '' || minimumPurchaseAmount == '' || maxRedeemAmount == '' || discountPercentage == '' || expiryDate == '') {
            return res.status(400).json({ success: false, message: "Please fill out all the fields" });
        } else {
            const regexName = new RegExp(couponName, 'i');
            const regexCode = new RegExp(couponCode, 'i');

            const existingCoupon = await CouponDB.findOne({
                $or: [
                    { couponName: regexName },
                    { couponCode: regexCode }
                ]
            });

            if (existingCoupon) {
                return res.status(400).json({ success: false, message: "Coupon name or code already exists. Please change it." });
            } else {
                const newCoupon = new CouponDB({
                    couponName: couponName,
                    couponCode: couponCode,
                    minPurchaseAmount: parseInt(minimumPurchaseAmount),
                    maxRedeemAmount: parseInt(maxRedeemAmount),
                    discountPercentage: parseInt(discountPercentage),
                    expiryDate: expiryDate
                });

                await newCoupon.save();

                return res.status(200).json({ success: true, message: 'Coupon added successfully' });
            }
        }

    } catch (error) {
        next(error)
    }
};


const loadEditCoupon = async (req,res , next)=>{
    try {
        const couponId = req.query.couponId
        const coupon = await CouponDB.findById(couponId)

        if (!coupon) {
           return res.redirect('/couponList')
        }
      

        res.render('editCoupon',{coupon})
    } catch (error) {
        next(error)
    }
}

const editCoupon = async (req, res,next) => {
    try {
        const {
            couponId,
            couponName,
            couponCode,
            minimumPurchaseAmount,
            discountPercentage,
            maxRedeemAmount,
            expiryDate
        } = req.body;

        if (couponName === '' || couponCode === '' || minimumPurchaseAmount === '' || maxRedeemAmount === '' || discountPercentage === '' || expiryDate === '') {
            return res.status(400).json({ success: false, message: "Please fill out all the fields" });
        } else {
            const existingCoupon = await CouponDB.findById(couponId);

            if (!existingCoupon) {
                return res.status(400).json({ success: false, message: "Coupon not found." });
            } else {
                const regexName = new RegExp(couponName, 'i');
                const regexCode = new RegExp(couponCode, 'i');

                // Check if the new coupon name or code already exists for another coupon
                const duplicateCoupon = await CouponDB.findOne({
                    $or: [
                        { couponName: regexName },
                        { couponCode: regexCode }
                    ],
                    _id: { $ne: couponId }
                });

                if (duplicateCoupon) {
                    return res.status(400).json({ success: false, message: "Coupon name or code already exists. Please choose another." });
                } else {
                    const updatedCoupon = await CouponDB.findByIdAndUpdate(couponId, {
                        $set: {
                            couponName: couponName,
                            couponCode: couponCode,
                            discountPercentage: discountPercentage,
                            minPurchaseAmount: minimumPurchaseAmount,
                            maxRedeemAmount: maxRedeemAmount,
                            expiryDate: expiryDate
                        }
                    }, { new: true }); // { new: true } option to return the updated document

                    return res.status(200).json({ success: true, message: 'Coupon updated successfully' });
                }
            }
        }
    } catch (error) {
        next(error)
    }
};


const deleteCoupon = async (req,res,next)=>{
    try {
        const {couponId} = req.body
        if(!couponId){
            return res.status(400).json({success:false,message:'Coupon not found'})
        }

        const coupon = await CouponDB.findById(couponId)
        if (!coupon) {
            return res.status(400).json({success:false,message:'Coupon not found'})
        }

        await CouponDB.findByIdAndDelete(couponId)
        return res.status(200).json({success:true,message:"Coupon deleted successfully"})
        


    } catch (error) {
        next(error)
    }
}

const updateStatus = async (req,res,next)=>{
    try {
        const {couponId} = req.body
        if(!couponId){
            return res.status(400).json({success:false,message:'Coupon not found'})
        }

        const coupon = await CouponDB.findById(couponId)
        if (!coupon) {
            return res.status(400).json({success:false,message:'Coupon not found'})
        }
        
        const newStatus = !coupon.listed
        await CouponDB.findByIdAndUpdate(couponId,{
            listed:newStatus
        })
       
        return res.status(200).json({success:true,message:"Coupon status changed successfully",listed: newStatus})


    } catch (error) {
        next(error)
    }
}


module.exports = {
    loadCouponPage,
    loadAddCoupon,
    addCoupon,
    loadEditCoupon,
    editCoupon,
    deleteCoupon,
    updateStatus
}