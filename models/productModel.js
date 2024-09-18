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
    discountAmount : {
        type : Number,
        default : 0
    },
    discountedPrice: {
        type: Number,
        default: function() {  
          return this.price - this.discountAmount;
        }
    },
    beforeOffer :{
        type : Number
    },
    inCategoryOffer : {
        type : Boolean,
        default : false
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

    productSchema.pre('save', function(next) {
        this.discountedPrice = this.price - this.discountAmount;
        next();
    });

    productSchema.methods.updateCategoryOffer = async function(categoryOffer) {
        if(categoryOffer && categoryOffer.status === 'Active'){
            this.inCategoryOffer = true;
            this.beforeOffer = this.price;
            this.discountAmount = Math.floor(this.price * (categoryOffer.offerPercentage / 100));
        }else{
            this.inCategoryOffer = false;
            this.discountAmount = 0;
            this.beforeOffer = 0;
        }

        this.discountedPrice = this.price - this.discountAmount
        await this.save()

      };
    


const product = mongoose.model('product',productSchema);

module.exports = product;