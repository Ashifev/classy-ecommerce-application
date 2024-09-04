const User = require('./userModel');
const mongoose = require('mongoose');
const Order = require('./orderModel');
const Product = require('../models/productModel');

const walletSchema = new mongoose.Schema({

    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : User,
        required : true
    },
    balance : {
        type : Number,
        default : 0
    },
    transactions : [
        {
            transaction_Id : {
                type : String,
                Unique : true
            },
            amount : {
                type : Number,
                required : true
            },
            type : {
                type : String,
                enum : ['credit','debit'],
                required : true
            },
            description : {
                type : String,
                required : true
            },
            orderId : {
                type : mongoose.Schema.Types.ObjectId,
                ref : Order
            },
            product : {
                type : mongoose.Schema.Types.ObjectId,
                ref : Product
            },
            createdAt : {
                type : Date,
                default : Date.now
            }
        }
    ]

})

const Wallet = mongoose.model("Wallet",walletSchema);

module.exports = Wallet;