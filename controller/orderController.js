const cartDB = require("../models/cartModel");
const { findById } = require("../models/categoryModel");
const productDB = require("../models/productModel");
const userDB = require("../models/userModel");
const addressDB = require('../models/addressModel');
const orderDB = require('../models/orderModel');
const { trusted } = require("mongoose");

module.exports = {
    getCheckout : async (req,res)=>{
        try{
            const userEmail = req.session.email;
            const user = req.session.user

            const User = await userDB.findOne({ email: userEmail });
            const userAddress = await addressDB.find({userId: User._id});
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

        const userProduct = await cartDB.findOne({ userId: User._id }).populate('products.productId');
        if (!userProduct || userProduct.products.length === 0) {
            return res.status(400).send('Cart is empty');
        }

        const cartProducts = userProduct.products.map((item) => ({
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

        for (const item of userProduct.products) {
            await productDB.findByIdAndUpdate(
                item.productId,
                { $inc: { stockQuantity: -item.quantity } },
                { new: true }
            );
        }

        await cartDB.findOneAndDelete(
            { userId: User._id },
        );

        res.render('user/orderPlaced',{order});
        // res.status(200).send('Order placed successfully');
    } catch (err) {
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
}



}