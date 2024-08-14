const cartDB = require("../models/cartModel");
const { findById } = require("../models/categoryModel");
const productDB = require("../models/productModel");
const userDB = require("../models/userModel");
const addressDB = require('../models/addressModel');
const orderDB = require('../models/orderModel');
const { mongoose } = require("mongoose");

module.exports = {
    getCheckout : async (req,res)=>{
        try{
            const userEmail = req.session.email;
            const user = req.session.user

            const User = await userDB.findOne({ email: userEmail });
            const userAddress = await addressDB.find({userId: User._id});
            let userCart = await cartDB.findOne({userId: User._id}).populate({
                path: "products.productId",
                model: "product",
                match: { isActive: true },
              });


            if(!userCart || userCart.length == 0){
              if (userCart?.products.length === 0) {
                await cartDB.findOneAndDelete({ userId:User.id });
                userCart = null;
              } 
                res.render('user/userCart',{empty:"No Products Found"});
            }else{
                const activeCartItems = userCart.products.filter((item) =>{
                    if(item.productId && item.productId.isActive){
                    return item
                    } 
                    });
                userCart = activeCartItems;
                   
                 console.log("user address",userAddress);
                 const totalPrice = userCart.reduce((price,curr) => {
                     return price + curr.price * curr.quantity
                 },0);
     
                 const subTotal = totalPrice;
                res.render('user/checkout',{userAddress,userCart,totalPrice,subTotal,user})
            }

        }catch(err){
            console.log("error at get checkout",err);
            res.render("500");
        }
    },
    orderSubmit: async (req, res) => {
    try {
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
           const activeCartItems = userProduct.products.filter((item) =>{
             if(item.productId && item.productId.isActive){
              return item
             } 
            });
            userProduct = activeCartItems;
          }

        if (!userProduct || userProduct.length === 0) {
            return res.status(400).redirect('/');
        }

        const cartProducts = userProduct.map((item) => ({
            productId: item.productId,
            name: item.productId.name,
            quantity: item.quantity,
            price: item.price,
            totalPrice: item.quantity * item.price
        }));

        console.log("cart Product ...",cartProducts);
        let totalQuantity = cartProducts.reduce((acc, product) => acc + product.quantity, 0);

        const order = new orderDB({
            userId: User._id,
            userName: User.name,
            productItems: cartProducts,
            billingAddress: userAddress,
            paymentMethod: payment,
            totalQuantity,
            totalPrice,
        });

        await order.save();

        for (const item of userProduct) {
            await productDB.findByIdAndUpdate(
                item.productId,
                { $inc: { stockQuantity: -item.quantity } },
                { new: true }
            );
        }

        await cartDB.findOneAndDelete(
            { userId: User._id },
        );
        req.session.orderId = order;
        res.redirect('order-placed')
        
        // res.status(200).send('Order placed successfully');
    } catch (err) {
        console.error("error at order submit",err);
        res.render("500");
    }
},
orderplaced:async(req,res)=>{
    try{
        const orderId = req.session.orderId;
        req.session.orderId = null
        const order = await orderDB.findById(orderId)
        res.render('user/orderPlaced',{order});
    }catch(err){
        console.error("error at order placed",err);
        res.render("500");
    }
},
getOrderDetails: async(req,res)=>{
    try{
        const orderId = req.params.id;
        const userOrder = await orderDB.findById(orderId).populate('productItems.productId')
        res.render('user/orderDetails',{userOrder})
    }catch(err){
        console.error("error at order details page",err);
        res.render("500");
    }
},
orderCancel: async(req,res)=>{
    try{
        const orderId = req.params.id
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

       await orders.save();
       console.log("count",count);
       
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
}



}