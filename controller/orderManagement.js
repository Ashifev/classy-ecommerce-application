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
        res.status(500).send('An error occurred while order list');
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
        res.status(500).send('An error occurred while order status update');
    }
},
getUserOrderList: async(req,res)=>{
    try{

    }catch(err){
        console.error("error at admin order list",err);
        res.status(500).send('An error occurred while placing the order');
    }
}
}