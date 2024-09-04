const mongoose = require('mongoose');

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
    userName:{
        type:String,
        default:true
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
    dateOrdered: {
        type: Date,
        default: Date.now
    }

});


module.exports = mongoose.model('Order', orderSchema);