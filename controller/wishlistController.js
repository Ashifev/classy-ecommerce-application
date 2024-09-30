const productDB = require('../models/productModel');
const userDB = require('../models/userModel');
const wishlistDB = require('../models/wishlistModel')
module.exports = {
    getWishList : async(req,res)=>{
        try{
            const user = req.session.user
            const userId = user._id;
            const wishlist = await wishlistDB.findOne({user:userId}).populate('items.product');
            if(!wishlist){
                return res.render('user/wishlist',{wishlist : [], user})
            }
            res.render('user/wishlist',{wishlist : wishlist.items, user})
        }catch(err){
            console.log("error at getting wish list",err);
            res.render('500')
        }
    },
    addWishToWishList : async(req,res)=>{
        try{
            const userId = req.session.user._id;
            const {productId} = req.body;
            const products = await productDB.findById(productId);
            var msg;
            if(!products){
                return res.status(404).res.json({ icon: "error", msg: "This Product is not founded" , success : false })
            }
            let wishlist = await wishlistDB.findOne({user : userId});
            if(!wishlist){
                wishlist = new wishlistDB({user : userId, items :[]})
            }
            const isProductThere = wishlist.items.some(item => item.product.toString() === productId)

            if(isProductThere){
                return res.status(200).json({ icon: "warning", msg: "This Product is Already in Wishlist" })
            }

            wishlist.items.push({product : productId})
            await wishlist.save();
            
            res.json({icon : 'success', msg : "Product Successfully added to the wishlist"})

        }catch(err){
            console.log("error at product add to wish list :",err);
            res.render('500');
        }
    },
    removeFromWishlist : async(req,res)=>{
        try{
            console.log("ethyoooo");
            
            const {productId} = req.body;
            const user = req.session.user;
            const wishlist = await wishlistDB.findOne({user:user._id});
            if(!wishlist){
                return res.status(404).json({success : false , message : "Product Not found in the wishlist"})
            }
            const updatedItems = wishlist.items.filter(item => item.product.toString() !== productId);

            var msg;
            if (wishlist.items.length === updatedItems.length) {
                return res.status(404).json({ success: false,icon:"warning", msg: "Product not found in wishlist" });
            }

            wishlist.items = updatedItems;
            await wishlist.save()
            if(wishlist.items.length === 0) await wishlistDB.findOneAndDelete({_id:wishlist._id});

            res.status(200).json({success : true ,icon : "success", msg : "product removed from the wishlist"})
        }catch(err){
            console.log("errror at remove product from wishlist",err);
            res.render('500')
        }
    },
    fetchWishList:async(req,res)=>{
        try{
            const user = req.session.user
            const userId = user._id;
            const wishlist = await wishlistDB.findOne({user:userId}).populate('items.product');
            res.json({wishlist})
        }catch(err){
            console.log("error at fetch wishlist",err);
            res.render('500')
            
        }
    }
}