const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({

    name: {
        type : String,
        required : true,
        unique : true
    },
    isActive : {
        type : Boolean,
        default : true
        // required : true
    },
    createDate : {
        type : Date,
        default : Date.now
    }
})

const brand = mongoose.model('brand',brandSchema)

module.exports = brand;