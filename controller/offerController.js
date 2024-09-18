const categoryDB = require('../models/categoryModel');
const productDB = require('../models/productModel');
const offerDB = require("../models/offerModel");
const product = require('../models/productModel');

module.exports = {
    getOffer : async(req,res)=>{
        try{
            const success = req.session.success;
            const err = req.session.errorMssg;

            delete req.session.success;
            delete req.session.errorMssg;

            const offers = await offerDB.find().populate('categoryId')

            res.render('admin/offers',{success,err,offers});
        }catch(err){

        }
    },
    addOfferGet : async(req,res)=>{
        try{
            const category = await categoryDB.find({isActive:true});
            res.render('admin/addOffer',{category,err:null});
        }catch(err){
            console.log("error at add offer getting",err);
            res.render('500')
        }
    },
    offerAdded : async(req,res)=>{
        try{
            const {categoryId,offerPercentage,expireDate} = req.body;
            console.log("category ud :",categoryId);
            console.log("offer percentage :",offerPercentage);
            console.log("expireDate :",expireDate);
            
            const offerExist = await offerDB.findOne({_id:categoryId});
            console.log("offerExist",offerExist);
            
            if(!offerExist){
                
                await offerDB.create(req.body);
                const categoryProduct = await productDB.find({category:categoryId});
                const offerApply = offerPercentage/100;
                console.log("product under category",categoryProduct);
                
                for(item of categoryProduct){
                    if(item.discountAmount === 0 ||  !item.inCategoryOffer){
                        const originalPrice = item.price;
                        const discountAmount = Math.floor(originalPrice * (offerPercentage/100));
                        const newPrice = Math.floor(originalPrice - discountAmount);

                        await productDB.updateOne(
                            {_id:item._id},
                            {$set :{inCategoryOffer:true, beforeOffer: originalPrice,discountAmount:discountAmount, discountedPrice : newPrice}}
                        )
                        const updatedProduct = await productDB.findById(item._id);
                        console.log('Updated product', updatedProduct);
                    }
                }
                req.session.success = "Added new Category Offer"
                res.redirect('/admin/offers');
            }else{
                req.session.err = "This category is already added to the offer";
                res.redirect('/admin/offers');
            }
        }catch(err){
            console.log("error at offer added",err);
            res.render('500')
        }
    },
    editOffer: async(req,res)=>{
        try{
            const offerId = req.params.id;
            const offer = await offerDB.findById(offerId).populate('categoryId');
            if(!offer){
                const err = "Not Found"
                return res.render('admin/editOffer',{err,category:null,offer:null})
            }
            const category = await categoryDB.find({isActive: true});
            res.render('admin/editOffer',{offer,category,err:null})
        }catch(err){
            console.log("error at edit offer",err);
            res.render('500');
        }
    },
    offerEdited : async(req,res)=>{
        try{
            const offerId = req.params.id;
            const {categoryId,offerPercentage,expireDate} = req.body;
            console.log("offer id",offerId);
            console.log("category ud :",categoryId);
            console.log("offer percentage :",offerPercentage);
            console.log("expireDate :",expireDate);

            const existOffer = await offerDB.findById(offerId).populate('categoryId');

            if(!existOffer){
                req.session.err = "offer Not found";
                console.log("offer not found");
                return res.redirect('/admin/offers');
            }

            const oldCategory = existOffer.categoryId._id.toString();


            if (categoryId == oldCategory) {
                const offerExist = await offerDB.findOne({categoryId: categoryId});
                if (offerExist) {
                    req.session.err = "Offer on this category already exists";
                    console.log("offer already exist");
                    
                    return res.redirect('/admin/offers');
                }
            }

            if(categoryId !== oldCategory){
                const oldProduct = await productDB.find({category : oldCategory , inCategoryOffer : true})
                for(const product of oldProduct){
                    await productDB.findByIdAndUpdate(
                        product._id,
                        {$set : {
                            discountedPrice : product.beforeOffer,
                            discountAmount : 0,
                            beforeOffer : 0,
                            inCategoryOffer : false
                        }},
                        {new : true}
                    )
                }
            }

                const updatedOffer = await offerDB.findByIdAndUpdate(
                    offerId,
                    {categoryId,offerPercentage,expireDate},
                    {new : true}
                )


            const newProduct = await productDB.find({category : categoryId});

            for (const item of newProduct){
               
                console.log("category offer set on product");
                    
                const originalPrice = item.price;
                const discountAmount = Math.floor(originalPrice * (offerPercentage/100));
                const newPrice = Math.floor(originalPrice - discountAmount);

                const updatedProduct = await productDB.findByIdAndUpdate(
                    item._id,
                    {$set : {inCategoryOffer : true , beforeOffer : originalPrice ,discountAmount:discountAmount, discountedPrice : newPrice}},
                    {new : true}
                )
            
            }
        console.log("successfully edited");
        
        req.session.success = "Offer updated successfully";
        res.redirect('/admin/offers');

        }catch(err){
            console.log("error at offer edited",err);
            res.render('500');
        }
    },
    deleteOffer : async (req,res) => {
        try{
            const offerId = req.params.id;
            const offerData = await offerDB.findById(offerId);
            const products = await productDB.find({category : offerData.categoryId });
            console.log("hererere");
            
            for(const item of products){
                console.log("for of loop");
                
                if(item.inCategoryOffer === true){
                    await productDB.updateOne(
                        {_id : item._id},
                        {
                            $set : {discountedPrice : product.beforeOffer ,discountAmount:0, beforeOffer : 0 , inCategoryOffer : false}
                        },
                        {new : true}
                    )
                }
            }

            await offerDB.findByIdAndDelete(offerId)
            var message;
            res.status(200).json({message : 'Offer Deleted Successfully' , success : true});
        }catch(error){
            console.error("Error while deleting the offer",error);
            res.render('500');
        }
    }
}