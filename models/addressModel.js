const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
    {
        userId: { 
            type: mongoose.Schema.Types.ObjectId,
            ref : 'User'
        },
        name: {
            type: String
        },
        mobile: {
            type: String
        },
        address: {
            type: String
        },
        pincode: {
            type: String
        },
        locality: {
            type: String
        },
        city: {
            type: String
        },
        state: {
            type: String
        },
        landmark: {
            type: String
        },
        alternateMobile:{
            type : String
        },
    }
)

const Address = mongoose.model('address', addressSchema);

module.exports = Address;