const mongoose = require('mongoose');
const Category = require('../models/categoryModel');
const Brand = require('../models/brandModel');

const productSchema = new mongoose.Schema({

    name : {
        type : String,
        required : true
    },
    price : {
        type : Number,
        required : true
    },
    description : {
        type : String,
        required : true
    },
    image : {
        type : [String],
        required : true
    },
    category : {
        type : mongoose.Schema.Types.ObjectId,
        ref : Category,
        required : true
    },
    brand : {
        type :  mongoose.Schema.Types.ObjectId,
        ref : Brand,
        requied : true
    },
    stockQuantity : {
        type : Number,
        required : true
    },
    status : {
        type : Boolean,
        default : true
    },
    isActive: {
        type : Boolean,
        default : true
    },
    createdAt : {
        type : Date,
        default : Date.now
    }
});


const product = mongoose.model('product',productSchema);

module.exports = product;