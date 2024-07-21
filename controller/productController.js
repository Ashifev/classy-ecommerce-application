const categoryDb = require("../models/categoryModel")
const brandDb = require("../models/brandModel")
const productDb = require('../models/productModel');
const brand = require("../models/brandModel");

module.exports = {
    productsGet: async(req,res)=>{
        try{
            const success = req.session.success;
            const err = null
            req.session.success = null
            const products = await productDb.find({isActive : true}).populate('brand').populate('category').sort({createdAt:-1});
            console.log("products",products);
            res.render('admin/products',{products,success,err})
        }catch(err){
            console.log("Error in product listing",err);
            res.render('500');
        }
    },
    addProducts : async(req,res)=>{
        try{
            const category = await categoryDb.find({isActive : true});
            const brand = await brandDb.find({isActive : true});
            res.render('admin/addProduct',{category,brand}) 
        }catch(err){
            console.log("error in add product",err);
            res.render('500');
        }
        
    },
    productAdded : async(req,res)=>{
        try{
            console.log("Uploading Files");
            const {name,price,description,category,brand,stockQuantity} = req.body;
            const files = req.files;
            const image = Object.values(files).flat().map((file)=> `/uploads/products/${file.filename}`)
            const newProduct = new productDb({name,price,description,image,category,brand,stockQuantity});
            await newProduct.save();
            req.session.success = "Product Added Successfully";
            res.redirect('/admin/products')
        }catch(err){
            console.log("Error in product store database",err);
            res.render('500');
        }
    },
    getEditProduct: async(req,res)=>{
        try{
            const category = await categoryDb.find({isActive : true});
            const brand = await brandDb.find({isActive : true});
            const product = await productDb.findById(req.params.id).populate('category').populate('brand');
            if(!product){
               req.session.errMsg = "Product Not Found"
               res.redirect('/admin/add-products');
            }
            const exist = req.session.exist;
            req.session.exist = null
            console.log("get edit product");
            res.render('admin/editProduct',{product,brand,category,exist})

        }catch(err){
            console.log("Get Edit Product Error",err);
            res.render('500');
        }
    },
    editedProduct : async(req,res)=>{
        const {name,price,description,category,brand,stockQuantity} = req.body;
        const files = req.files
        const {id} = req.params;
        const Name = name
        try{
            const existProduct = await productDb.findOne({name : Name});
            if(existProduct && existProduct._id.toString() !== id){
                req.session.exist = "This Product is already existed"
                res.redirect('/admin/edit-product')
            }else{
               const image = Object.values(files).flat().map((file)=> `/uploads/products/${file.filename}`)
               const product =  await productDb.findByIdAndUpdate({_id:id},{name:Name,price:price,description:description,brand:brand,category:category,stockQuantity:stockQuantity,image:image},{new : true})
               if(!product){
                req.session.errMsg = "Product not found";
                res.redirect('/admin/products')
               }
               req.session.success = "Product Edited Successfully"
               res.redirect('/admin/products');
            }
        }catch(err){
            console.log("edited product error",err);
            res.render('500');
        }
    },
    deleteProduct : async(req,res)=>{
        try{
            console.log("ProductDeletessss");
            const id = req.params.id;

            console.log("id",id);

            const productDelete = await productDb.findById(id);
            if(!productDelete){
               return res.json({ success: false, message: "product not found" });  
            }else{
                var msg
           
            console.log("productIDD,",productDelete);
                if(productDelete.isActive){
                    await productDb.findByIdAndUpdate(id,{isActive:false},{new:true})
                    msg="succusfully deleted"
            
                }else{
                    await productDb.findByIdAndUpdate(id,{isActive:true},{new:true})
                    msg="succusfully unblocked"
                }
            }
            res.json({ success: true, msg })
        }catch(err){
            console.log("Status update error",err);
            res.render('500');
        }
    }
}