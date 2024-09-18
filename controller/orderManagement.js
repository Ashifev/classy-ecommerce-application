const uuid = require('uuid');
const cartDB = require("../models/cartModel");
const { findById } = require("../models/categoryModel");
const productDB = require("../models/productModel");
const userDB = require("../models/userModel");
const addressDB = require('../models/addressModel');
const orderDB = require('../models/orderModel');
const walletDB = require('../models/walletModel')
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
            if(userOrder.productItems[i].status !=="Cancelled" || "cancelled"){
                userOrder.productItems[i].status = status;
            }
        }
        await userOrder.save();
        let msg = "Order status changed Successfully"
        res.json({ success: true, msg })
    }catch(err){
        console.error("error at admin order status update",err);
        res.render("500");
    }
},
updateItemStatus: async(req,res)=>{
    try{
        const {orderId,itemId, status} = req.body;
        console.log("req.bodyy",req.body);

        const userOrder = await orderDB.findById(orderId);
        console.log("userOrder",userOrder);
        
        const productIndex = userOrder.productItems.findIndex((product)=>product.productId.toString() === itemId)

        console.log("productIndex",productIndex);
        
        if(productIndex > -1){
            userOrder.productItems[productIndex].status = status
        }

        let count = 0;
        for(let product of userOrder.productItems){
            if(product.status===status){
                count ++
            }
        }
        if(userOrder.productItems.length === count){
            userOrder.status = status
        }
        // for(let i = 0; i<userOrder.productItems.length; i++){
        //     if(userOrder.productItems[i].status !=="Cancelled" || "cancelled"){
        //         userOrder.productItems[i].status = status;
        //     }
        // }
        
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

        // Qauntity Increase and wallet
            orders.productItems.forEach((value)=>{
                returnItem.forEach(async (item) => {
                    if (value.productId.toString() === item.productId.toString()) {
                       await productDB.findByIdAndUpdate(
                           value.productId,
                           { $inc: { stockQuantity: value.quantity } },
                           { new: true }
                       );
                    }

                    if(orders.paymentMethod === 'Wallet' || orders.paymentMethod === 'razorpay'){
                        const userExists = await walletDB.findOne({user : orders.userId})
                        if(userExists){
                            await walletDB.findByIdAndUpdate(userExists._id,{
                                $inc : {balance : item.price - item.discountAmount},
                                $push : {
                                    transactions: {
                                        transaction_Id : `myWallet${uuid.v4()}`,
                                        amount : item.price - item.discountAmount,
                                        type : 'credit',
                                        description : 'Order Cancelled Refund',
                                        orderId : orders._id,
                                        product : item.productId
                                    }
                                }
                            })
                        }else{
                            await walletDB.create({
                                user : orders.userId,
                                balance :item.price,
                                transactions : {
                                    transaction_Id : `myWallet${uuid.v4()}`,
                                    amount : item.price,
                                    type : 'credit',
                                    description : 'Order Cancelled Refund',
                                    orderId : orders._id,
                                    product : item.productId
                                }
                            })
                        }
                    }
               })
           })

           await orders.save();
           let count = 0;
           orders.productItems.forEach((value)=>{
               if(value.status === "Return Request Accepted"){
                   count ++;
               }
          })
   
          if(count === orders.productItems.length){
           orders.status = "Return Request Accepted"
          }

        await orders.save();
       
        res.status(200).json({success:true,msg:"order Return Requested successfully"})
    }catch(err){
        console.error("error at order cancel",err);
        res.render("500");
    }
}
}