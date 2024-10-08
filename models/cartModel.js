const mongoose = require('mongoose');
const product = require('../models/productModel');

const cartSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref:'User',
    },
    products : [
        {
            productId :{
                type : mongoose.Schema.Types.ObjectId,
                ref: 'product',
            },
            quantity : {
                type : Number
            }
        }
    ],
})

const cart = mongoose.model("carts",cartSchema);
module.exports = cart;