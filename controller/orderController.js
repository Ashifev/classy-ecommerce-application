const cartDB = require("../models/cartModel");
const { findById } = require("../models/categoryModel");
const productDB = require("../models/productModel");
const userDB = require("../models/userModel");
const addressDB = require('../models/addressModel');
const orderDB = require('../models/orderModel');
const walletDB = require('../models/walletModel');
const razorpay = require('razorpay')
const uuid = require('uuid');
const { mongoose } = require("mongoose");
const product = require("../models/productModel");
const couponDB = require('../models/couponModel');
const {generateInvoice} = require('../services/invoiceGen');

module.exports = {
    getCheckout : async (req,res)=>{
        try{
            const user = req.session.username
            const userId = req.session.user;
            const wallet = await walletDB.findOne({user:userId._id});

            const userAddress = await addressDB.find({userId: userId._id});
            let userCart = await cartDB.findOne({userId:userId._id}).populate({
                path: "products.productId",
                model: "product",
                match: { isActive: true },
            });

            console.log("userCart for checkou : ",userCart);
            
            if(!userCart || userCart.length == 0){
                if (userCart?.products.length === 0) {
                    await cartDB.findOneAndDelete({ userId:userId.id });
                    userCart = null;
                } 
                return res.render('user/userCart',{empty:"No Products Found"});
            }
                
                   
                 console.log("user address",userAddress);
                 
                    var subTotal = userCart.products.reduce((price,curr) => {
                        return price + curr.price * curr.quantity
                    },0);
                 
                 
                //  console.log("total before",totalPrice);

                 let finalTotal = subTotal - userCart.discount;
    
                //  console.log("total after",totalPrice);
                 
                console.log("user cart",userCart);
                
                let couponDiscount = 0;

                if (req.session.appliedCoupon) {
                    couponDiscount = req.session.appliedCoupon.discountAmount;
                    finalTotal = Number((finalTotal - couponDiscount).toFixed(2));
                }

                const coupons = await couponDB.find(
                    {minPurchaseAmount : {$lte : finalTotal}}
                )
                

                res.render('user/checkout',{userAddress,userCart,coupons, totalPrice:finalTotal, subTotal : subTotal ,appliedCoupon : req.session.appliedCoupon,discountAmount:couponDiscount,newTotal:finalTotal,user,wallet})
            

        }catch(err){
            console.log("error at get checkout",err);
            res.render("500");
        }
    },
    orderSubmit: async (req, res) => {
    try {
        console.log("order controller entered");
        
        const userEmail = req.session.email;
        const { address, payment, totalPrice } = req.body;

        const User = await userDB.findOne({ email: userEmail });
        if (!User) {
            return res.status(404).send('User not found');
        }

        const userAddress = await addressDB.findById(address);
        if (!userAddress) {
            return res.status(404).send('Address not found');
        }

        let userProduct = await cartDB.findOne({ userId: User._id }).populate({
            path: "products.productId",
            model: "product",
            match: { isActive: true },
          });

          if (userProduct?.products.length === 0) {
            await cartDB.findOneAndDelete({ userId:User.id });
            userProduct = null;
          } else if (userProduct) {
           var activeCartItems = userProduct.products.filter((item) =>{
             if(item.productId && item.productId.isActive){
              return item
             } 
            });
            // userProduct = activeCartItems;
          }

        if (!activeCartItems || activeCartItems.length === 0) {
            return res.status(400).redirect('/');
        }

        const cartProducts = activeCartItems.map((item) => ({
            productId: item.productId,
            name: item.productId.name,
            quantity: item.quantity,
            price: item.price,
            discountAmount : item.discountAmount,
            totalPrice: item.quantity * item.price
        }));

        console.log("cart Product ...",cartProducts);
        let totalQuantity = cartProducts.reduce((acc, product) => acc + product.quantity, 0);

        const couponCode = req.session?.appliedCoupon?.couponCode;
        const couponDiscount = req.session?.appliedCoupon?.discountAmount;

        const coupon = await couponDB.findOne({couponCode})
        if(coupon){
            var discount = coupon.discountAmount + userProduct.discount;
        }
        const order = new orderDB({
            userId: User._id,
            userName: User.name,
            productItems: cartProducts,
            billingAddress: userAddress,
            paymentMethod: payment,
            totalQuantity,
            totalPrice,
            coupon,
            couponDiscount,
            discount
        });

        if(order.paymentMethod=="Wallet"){
            order.paymentStatus = "Paid";
            await walletDB.findOneAndUpdate({user : User._id},{
                $inc : {balance : - totalPrice},
                $push : {
                    transactions : {
                        transaction_id : `wallet${uuid.v4()}`,
                        amount : totalPrice,
                        type : 'debit',
                        description : 'order payment success',
                        orderId : order._id,
                        product : userProduct._id
                    } 
                }
            })
        }

        if(order.paymentMethod=="razorpay"){
            order.paymentStatus = "Paid";
        }

        await order.save();

        for (const item of activeCartItems) {
            await productDB.findByIdAndUpdate(
                item.productId,
                { $inc: { stockQuantity: -item.quantity } },
                { new: true }
            );
        }

        await cartDB.findOneAndDelete(
            { userId: User._id },
        );
        // req.session.orderId = order;
        // res.redirect('/order-placed')
        console.log(order);
        delete req.session.appliedCoupon;
        return res.status(200).json(order);
    } catch (err) {
        console.error("error at order submit",err);
        res.render("500");
    }
},
failedOrderSubmit: async (req, res) => {
    try {
        console.log("order controller entered");
        
        const userEmail = req.session.email;
        const { address, payment, totalPrice } = req.body;

        const User = await userDB.findOne({ email: userEmail });
        if (!User) {
            return res.status(404).send('User not found');
        }

        const userAddress = await addressDB.findById(address);
        if (!userAddress) {
            return res.status(404).send('Address not found');
        }

        let userProduct = await cartDB.findOne({ userId: User._id }).populate({
            path: "products.productId",
            model: "product",
            match: { isActive: true },
          });

          if (userProduct?.products.length === 0) {
            await cartDB.findOneAndDelete({ userId:User.id });
            userProduct = null;
          } else if (userProduct) {
           var activeCartItems = userProduct.products.filter((item) =>{
             if(item.productId && item.productId.isActive){
              return item
             } 
            });
            // userProduct = activeCartItems;
          }

        if (!activeCartItems || activeCartItems.length === 0) {
            return res.status(400).redirect('/');
        }

        const cartProducts = activeCartItems.map((item) => ({
            productId: item.productId,
            name: item.productId.name,
            quantity: item.quantity,
            price: item.price,
            discountAmount : item.discountAmount,
            totalPrice: item.quantity * item.price
        }));

        console.log("cart Product ...",cartProducts);
        let totalQuantity = cartProducts.reduce((acc, product) => acc + product.quantity, 0);

        const couponCode = req.session?.appliedCoupon?.couponCode;
        const couponDiscount = req.session?.appliedCoupon?.discountAmount;

        const coupon = await couponDB.findOne({couponCode})
        if(coupon){
            var discount = coupon.discountAmount + userProduct.discount;
        }
        const newOrder = new orderDB({
            userId: User._id,
            userName: User.name,
            productItems: cartProducts,
            billingAddress: userAddress,
            paymentMethod: payment,
            totalQuantity,
            totalPrice,
            coupon,
            couponDiscount,
            discount
        });

        if(newOrder.paymentMethod=="razorpay"){
            newOrder.status = "Payment failed"
            newOrder.paymentStatus = "failed";
        }

        await newOrder.save();

        for (const item of activeCartItems) {
            await productDB.findByIdAndUpdate(
                item.productId,
                { $inc: { stockQuantity: -item.quantity } },
                { new: true }
            );
        }

        await cartDB.findOneAndDelete(
            { userId: User._id },
        );
        // req.session.orderId = order;
        // res.redirect('/order-placed')
        console.log(newOrder);
        delete req.session.appliedCoupon;
        console.log("failed order saved");
        
        return res.status(200).json(newOrder);
    } catch (err) {
        console.error("error at order submit",err);
        res.render("500");
    }
},
saveFailedOrder : async(req,res)=>{
    try{
        const {orderId} = req.body;
        const userId = req.session.user._id;

        if(!userId){
        return res.status(401).json({ message: "User not authenticated" });
        }

        const order =  await orderDB.findOneAndUpdate({_id:orderId},{
            $set: {
                paymentStatus: "Paid",
                status : 'Pending'
            }
        },{ new: true });

        if(!order){
            return res.status(404).json({ message: "Order not found" });
        }


    return res.status(200).json({ message: "Order repayment successfully" });
    }catch(err){
        console.log("error at saving failed order",err);
        res.render('500');
    }
},
orderplaced:async(req,res)=>{
    try{
        const orderId = req.params.id;
        const order = await orderDB.findById(orderId)
        res.render('user/orderPlaced',{order});
    }catch(err){
        console.error("error at order placed",err);
        res.render("500");
    }
},
getOrderDetails: async(req,res)=>{
    try{
        const user = req.session.user.name;
        const orderId = req.params.id;
        const userOrder = await orderDB.findById(orderId).populate('productItems.productId')
        res.render('user/orderDetails',{userOrder,user})
    }catch(err){
        console.error("error at order details page",err);
        res.render("500");
    }
},
orderCancel: async(req,res)=>{
    try{
        const orderId = req.params.id
        const userId = req.session.user
        const cancelOrder = await orderDB.findById(orderId);
        console.log("prder",cancelOrder);

        cancelOrder.status = "Cancelled";
        cancelOrder.productItems.forEach((product)=>{
            // cancelOrder.totalPrice = parseInt(cancelOrder.totalPrice) - parseInt(product.price); 
            product.status = "Cancelled"
        })
        
        for (const item of cancelOrder.productItems) {
            await productDB.findByIdAndUpdate(
                item.productId,
                { $inc: { stockQuantity: item.quantity } },
                { new: true }
            );
        }

        await cancelOrder.save();

        if(cancelOrder.paymentMethod !== 'COD'){

            const userExists = await walletDB.findOne({user : userId})
            if(userExists){
                await walletDB.findByIdAndUpdate(userExists._id,{
                    $inc : {balance : cancelOrder.totalPrice},
                    $push : {
                        transactions: {
                            transaction_Id : `myWallet${uuid.v4()}`,
                            amount : cancelOrder.totalPrice,
                            type : 'credit',
                            description : 'Order Cancelled Refund',
                            orderId : cancelOrder._id,
                            product : cancelOrder.productItems.forEach((items)=>items.productId)
                        }
                    }
                })
            }else{
                await walletDB.create({
                    user : userId,
                    balance : cancelOrder.totalPrice,
                    transactions : {
                        transaction_Id : `myWallet${uuid.v4()}`,
                        amount : cancelOrder.totalPrice,
                        type : 'credit',
                        description : 'Order Cancelled Refund',
                        orderId : cancelOrder._id,
                        product : cancelOrder.productItems.forEach((items)=>items.productId)
                    }
                })
            }
        }

        console.log("order cancalled");

        res.status(200).json({success:true,msg:"order cancelled successfully"})
    }catch(err){
        console.error("error at order cancel",err);
        res.render("500");
    }
},
itemCancel: async(req,res)=>{
    try{
        const {orderId,orderItem} = req.query;
        const userId = req.session.user;
        // const orderItem = req.params.id
        let itemQuantity = 0
        const orders = await orderDB.findById(orderId);
        console.log("this Order",orders);
        
        const cancelItems = orders.productItems.filter((value)=>{
            if(value.productId.toString()===orderItem) return value
        });
        orders.productItems.forEach((value)=>{
            console.log("value.id",value.productId);
            cancelItems.forEach((cancelItem) => {
                if (value.productId.toString() === cancelItem.productId.toString()) {
                    value.status = "Cancelled";
                    // orders.totalPrice = parseInt(orders.totalPrice) - parseInt(value.price); 
                    itemQuantity = parseInt(value.quantity) 
                }
            })
        })
        console.log("item quantity", itemQuantity);

        //Qauntity Increase
            orders.productItems.forEach((value)=>{
                cancelItems.forEach(async (cancelItem) => {
                    if (value.productId.toString() === cancelItem.productId.toString()) {
                       await productDB.findByIdAndUpdate(
                           value.productId,
                           { $inc: { stockQuantity: value.quantity } },
                           { new: true }
                       );
                   }
               })
           })
        
        await orders.save();
        let count = 0;
        orders.productItems.forEach((value)=>{
            if(value.status === "Cancelled"){
                count ++;
            }
       })

       if(count === orders.productItems.length){
        orders.status = "Cancelled"
       }
       
       //refund to wallet
       if(orders.paymentMethod !== "COD"){
        const userExist = await walletDB.findOne({user : userId})
        if(userExist){
            orders.productItems.forEach((value)=>{
                cancelItems.forEach(async (cancelItem) => {
                    if (value.productId.toString() === cancelItem.productId.toString()) {
                        await walletDB.findByIdAndUpdate(userExist._id,{
                            $inc : {balance : value.price},
                            $push : {
                                transactions : {
                                    transaction_Id : `myWallet${uuid.v4()}`,
                                    amount : value.price,
                                    type : 'credit',
                                    description : 'order cancelled refunded',
                                    orderId : orderId,
                                    product : value.productId
                                } 
                            }
                        })
                   }
               })
           })  
        }else{
            orders.productItems.forEach((value)=>{
                cancelItems.forEach(async (cancelItem) => {
                    if (value.productId.toString() === cancelItem.productId.toString()) {
                        await walletDB.create({
                            user : userId,
                            balance : value.price,
                            transactions : {
                                transaction_Id : `myWallet${uuid.v4()}`,
                                amount : value.price,
                                type : 'credit',
                                description : 'order cancelled refunded',
                                orderId : orderId,
                                product : value.productId
                            } 
                        })
                    }
               })
           })  
        }
       }


        await orders.save();

        res.status(200).json({success:true,msg:"order cancelled successfully"})
    }catch(err){
        console.error("error at order cancel",err);
        res.render("500");
    }
},
itemReturn : async(req,res)=>{
    try{
        const { orderId, productId, reason } = req.query;
        // const orderItem = req.params.id
        // let itemQuantity = 0
        const orders = await orderDB.findById(orderId);
        console.log("this Order",orders);
        
        const returnItem = orders.productItems.filter((value)=>{
            if(value.productId.toString()===productId) return value
        });

        orders.productItems.forEach((value)=>{
            console.log("value.id",value.productId);
            returnItem.forEach((item) => {
                if (value.productId.toString() === item.productId.toString()) {
                    value.status = "Return Requested";
                    value.returnReason = reason;
                }
            })
        })
        await orders.save();
       
        // Automatically reject return request after 24 hours if not approved
        setTimeout(async () => {
            const updatedOrder = await orderDB.findById(orderId);
            updatedOrder.productItems.forEach((value) => {
                returnItem.forEach((item) => {
                    if (value.productId.toString() === item.productId.toString() && value.status === "Return Requested") {
                        value.status = "Return Request Rejected";
                    }
                });
            });
            await updatedOrder.save();
        }, 7 * 24 * 60 * 60 * 1000); // 7 days in milliseconds


        res.status(200).json({success:true,msg:"order Return Requested successfully"})
    }catch(err){
        console.error("error at order cancel",err);
        res.render("500");
    }
},
generateInvoice : async(req,res)=>{
    try{
        const {orderId} = req.params;
        const orderDetails = await orderDB.findOne({_id:orderId}).populate('productItems.productId')
        // const deliveredProducts = orderDetails.productItems.filter(product => product.status === "Delivered")

        if(orderDetails){
            const invoice = await generateInvoice(orderDetails);
            res.json({success: true, message:"Invoice generated Successfully",invoice})
        }else{
            res.status(500).json({success:false, message:"Invoice generation Failed"})
        }
    }catch(err){
        console.log("error at generate invoice :",err);
        res.render('500');
    }
},
downloadInvoice : async (req,res) => {

    try{

        const id = req.params.orderId;

        const filePath = `public/infoPdf/${id}.pdf`;

        res.download(filePath,`invoice_${id}.pdf`);
            
    }catch(error){
        console.error("Error while downloading the invoice",error);
        res.status(500).json({success : false , message : 'Error in downloading Invoice'});
    }
}



}