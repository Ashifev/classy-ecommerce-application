const categoryDb = require("../models/categoryModel")
const brandDb = require("../models/brandModel")
const productDb = require('../models/productModel');
const brand = require("../models/brandModel");
const path = require('path');
const fs = require('fs');

module.exports = {
    productsGet: async(req,res)=>{
        try{
            const success = req.session.success;
            const err = null
            req.session.success = null
            const products = await productDb.find({isActive : true}).populate('brand').populate('category').sort({createdAt:-1});
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
        try {
            const productId = req.params.id;
            const product = await productDb.findById(productId);
            if (!product) {
                return res.status(404).render('404');
            }
    
            const { name, price, description, category, brand, discountAmount, stockQuantity, deletedImages, editedImages } = req.body;
    
            console.log("edited image",editedImages);
            console.log("deleted image",deletedImages);
            
            product.name = name;
            product.price = price;
            product.description = description;
            product.category = category;
            product.brand = brand;
            product.discountAmount = discountAmount;
            product.stockQuantity = stockQuantity;
    
            console.log("product editeddd", product);
            
            // Create a new array to store updated images
            let updatedImages = [...product.image];
    
            // Handle deleted images
            if (deletedImages) {
                let deletedIndixes = JSON.parse(deletedImages).map(index => Number(index));
            
                console.log("Indexes to delete:", deletedIndixes);
            
                // Filter out the images that need to be deleted
                const imagesToDelete = product.image.filter((_, index) => deletedIndixes.includes(index));
            
                // Ensure that images are being filtered out correctly
                if (imagesToDelete.length > 0) {
                    // Asynchronous deletion of files
                    imagesToDelete.forEach(imagePath => {
                        const fullPath = path.join(__dirname, '..', 'public', imagePath);
                        fs.unlink(fullPath, (err) => {
                            if (err) {
                                console.error("Error deleting image file:", err);
                            } else {
                                console.log("Deleted file:", fullPath);
                            }
                        });
                    });
            
                    // Update the images array after deletions
                    updatedImages = updatedImages.filter((_, index) => !deletedIndixes.includes(index));
                } else {
                    console.log("No images found to delete.");
                }
            } else {
                console.log("No images to delete.");
            }
            
    
            // Handle edited images
            if (editedImages) {
                const editedImageData = JSON.parse(editedImages);
                editedImageData.forEach(item => {
                    if (item.index < updatedImages.length) {
                        if (updatedImages[item.index] !== item.path) {
                            const oldImagePath = updatedImages[item.index];
                            const fullPath = path.join(__dirname, '..', 'public', oldImagePath);
                            fs.unlink(fullPath, (err) => {
                                if (err) console.error("Error deleting old edited image file:", err);
                            });
    
                            updatedImages[item.index] = item.path;
                        }
                    }
                });
            }
    
            if (req.files && req.files.newImages) {
                const newImagePaths = req.files.newImages.map(file => `/uploads/products/${file.filename}`);
                updatedImages = updatedImages.concat(newImagePaths);
            }
    
            product.image = updatedImages;
    
            await product.save();
            req.session.success = "Product edited successfully"
            res.redirect('/admin/products');
        } catch (error) {
            console.error("Error updating product", error);
            return res.status(500).render('500');
        }
    },
    cropImage: async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file provided' });
        }
        const croppedImagePath = `/uploads/products/${req.file.filename}`;
        res.json({ success: true, croppedImagePath });
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