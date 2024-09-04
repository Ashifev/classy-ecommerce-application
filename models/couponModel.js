const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    couponName : {
        type : String,
        required : true
    },
    couponCode : {
        type : String,
        unique : true,
        required : true
    },
    discountAmount : {
        type : Number,
        required : true
    },
    validFrom : {
        type : Date,
        required : true
    },
    validTo : {
        type : Date,
        required : true
    },
    minPurchaseAmout : {
        type : Number,
        required : true
    },
    isActive : {
        type : Boolean,
        default : true
    },
},
    {
        timestamps : true
    }
)
module.exports = mongoose.model('coupon',couponSchema);