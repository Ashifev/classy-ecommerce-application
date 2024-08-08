const cartDB = require("../models/cartModel");
const { findById } = require("../models/categoryModel");
const productDB = require("../models/productModel");
const userDB = require("../models/userModel");
const addressDB = require('../models/addressModel');
const orderDB = require('../models/orderModel');
const { trusted } = require("mongoose");

module.exports = {
getAdminOrderList: async(req,res)=>{
    try{
        const orderData = await orderDB.find().populate('productItems.productId').sort({dateOrdered:-1});;
        console.log("ordersss",orderData);
        res.render('admin/orderList',{orderData})
    }catch(err){
        console.error("error at admin order list",err);
        res.render("500");
    }
},
updateOrderStatus: async(req,res)=>{
    try{
        const {orderId, status} = req.body;
        console.log("req.bodyy",req.body);

        const userOrder = await orderDB.findByIdAndUpdate(orderId,{status:status},{ new: true });

        for(let i = 0; i<userOrder.productItems.length; i++){
            userOrder.productItems[i].status = status;
        }
        await userOrder.save();
        let msg = "Order status changed Successfully"
        res.json({ success: true, msg })
    }catch(err){
        console.error("error at admin order status update",err);
        res.render("500");
    }
},
getAdminOrderView: async(req,res)=>{
    try{
        const orderId = req.params.id;
        const userOrder = await orderDB.findById(orderId).populate('productItems.productId')
        const thisUser = await userDB.findById(userOrder.userId);
        res.render('admin/orderDetails',{userOrder,thisUser});
    }catch(err){
        console.error("error at admin order list",err);
        res.render("500");
    }
},
acceptReturn : async(req,res)=>{
    try{
        console.log("reaacheddd");
        
        const { orderId, acceptItem, returnReason } = req.query;
        let itemQuantity = 0;
        const orders = await orderDB.findById(orderId);
        console.log("this Order",orders);
        
        const returnItem = orders.productItems.filter((value)=>{
            if(value.productId.toString()===acceptItem) return value
        });
        console.log("return Item",returnItem);
        
        orders.productItems.forEach((value)=>{
            console.log("value.id",value.productId);
            returnItem.forEach((item) => {
                if (value.productId.toString() === item.productId.toString()) {
                    value.status = "Return Request Accepted";
                    // orders.totalPrice = parseInt(orders.totalPrice) - parseInt(value.price); 
                    itemQuantity = parseInt(value.quantity) 
                }
            })
        })


        // console.log("item quantity", itemQuantity);

        // Qauntity Increase
            orders.productItems.forEach((value)=>{
                returnItem.forEach(async (item) => {
                    if (value.productId.toString() === item.productId.toString()) {
                       await productDB.findByIdAndUpdate(
                           value.productId,
                           { $inc: { stockQuantity: value.quantity } },
                           { new: true }
                       );
                   }
               })
           })
        
        await orders.save();
    //     let count = 0;
    //     orders.productItems.forEach((value)=>{
    //         if(value.status === "Cancelled"){
    //             count ++;
    //         }
    //    })
    //    console.log("count",count);
       
        res.status(200).json({success:true,msg:"order Return Requested successfully"})
    }catch(err){
        console.error("error at order cancel",err);
        res.render("500");
    }
}
}