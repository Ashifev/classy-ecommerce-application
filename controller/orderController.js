const cartDB = require("../models/cartModel");
const { findById } = require("../models/categoryModel");
const product = require("../models/productModel");
const userDB = require("../models/userModel");
const addressDB = require('../models/addressModel');

module.exports = {
    getCheckout : async (req,res)=>{
        try{
            const userEmail = req.session.email;
            const user = req.session.user

            const User = await userDB.findOne({ email: userEmail });
            const userAddress = await addressDB.find({userId: User._id , isActive:true});
            const userCart = await cartDB.findOne({userId: User._id}).populate('products.productId');

            console.log("user address",userAddress);
            const totalPrice = userCart.products.reduce((price,curr) => {
                return price + curr.price * curr.quantity
            },0);

            const subTotal = totalPrice;

            if(!userCart || userCart.products.length == 0){
                res.render('user/userCart');
            }else{

                res.render('user/checkout',{userAddress,userCart,totalPrice,subTotal,user})
            }

        }catch(err){
            console.log("error at get checkout",err);
        }
    }
}