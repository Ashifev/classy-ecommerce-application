const mongoose = require('mongoose');
const User = require('./userModel');
const Product = require('./productModel');

const wishlistSchema = new mongoose.Schema({
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : User,
        required : true
    },
    items : [
        {
            product : {
                type : mongoose.Schema.Types.ObjectId,
                ref : Product,
            }
        }
    ]
})

const wishlist = mongoose.model('wishlist',wishlistSchema);
module.exports = wishlist;