const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
    name : {
        type : String,
        unique : true,
        required : true
    },
    isActive : {
        type : Boolean,
        default : true
        // required : true,
    },
    isDeleted : {
        type : Boolean,
        default : false
    },
    createdDate : {
        type : Date,
        default : Date.now
    }
})

const category = mongoose.model('category',categorySchema)

module.exports = category;