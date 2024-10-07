const mongoose = require('mongoose');
const Coupon = require('./couponModel');

const addressSchema = new mongoose.Schema({
    name : String,
    mobile: String,
    address: String,
    locality: String,
    landmark: String,
    city: String,
    state: String,
    pincode: String,
    country: {
        type:String,
        default : "India"
    }
})

const productSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product'
    },
    name: String,
    quantity: Number,
    price: Number,
    total: Number,
    discountAmount : Number,
    status: {
        type: String,
        default: 'Pending'
    },
    returnReason: {
        type: String,
        default: 'not returned'
    },
});

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    totalQuantity: {
        type :Number
    },
    totalPrice: {
        type: Number
    },
    productItems: [productSchema],
    billingAddress: [addressSchema],
   
    status: {
        type: String,
        required: true,
        default: 'Pending'
    },
    
    paymentMethod: {
        type: String,
        required: true,
        enum: ['COD', 'razorpay', 'Wallet'],
        default: 'COD'
    },
    paymentStatus : {
        type : String,
        enum : ['pending','Paid','failed'],
        default : 'pending'
    },
    paymentDetails : {
        razorpayOrderId : String,
        razorpayPaymentId : String,
        razorpaySignature : String
    },
    coupon : {
        type : mongoose.Schema.Types.ObjectId,
        ref : Coupon
    },
    couponDiscount : {
        type : Number,
        default : 0
    },
    discount : {
        type : Number,
        default : 0
    },
    dateOrdered: {
        type: Date,
        default: Date.now
    }

});


module.exports = mongoose.model('Order', orderSchema);