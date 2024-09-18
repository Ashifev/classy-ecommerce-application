const mongoose = require('mongoose');
const Category = require('./categoryModel');


const offerSchema = new mongoose.Schema({
    categoryId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : Category
    },
    offerPercentage :{
        type : Number,
        required : true
    },
    expireDate : {
        type : Date,
        required : true
    },
    status : {
        type : String,
        default : 'Active'
    },
    createdAt : {
        type : Date,
        default : Date.now
    }
});

const Offer = mongoose.model('offer',offerSchema);
module.exports = Offer