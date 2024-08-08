const mongoose = require('mongoose');

const returnItemSchema = new mongoose.Schema(
    {
        userId : {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'User'
        },
        orderId : {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'Order'
        },
        productId : {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'Product'
        },
        reason : {
            type : String
        },
        status : {
            type : String,
            default : 'Return Requested'
        }
    }
)

const ReturnItem = mongoose.model('returnItem',returnItemSchema);

module.exports = ReturnItem;