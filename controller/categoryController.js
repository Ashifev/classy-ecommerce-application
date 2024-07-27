const categoryDb = require('../models/categoryModel');
const productDb = require('../models/productModel');

module.exports = {
    getCategory : async (req,res)=>{
        try{
            const success = req.session.success;
            const err = req.session.errMsg; 
    
            req.session.success = null
            req.session.errMsg = null
    
            const category = await categoryDb.find()
            res.render('admin/category',{category,success,err})
        }catch(err){
            console.log("error in getting category at admin side");
            res.render("500");
        }
    },
    addCategory : async(req,res)=>{
        try{
            const err = req.session.errMsg;
            req.session.errMsg = null
            res.render('admin/addCategory',{err})
        }catch(err){
            console.log("error at add category at admin side");
            res.render("500");
        }
    },
    categoryAdded: async(req,res)=>{
        const {name} = req.body;
        const names = name.toLowerCase();
        console.log("req body",req.body);
        try{
            console.log("body name",names);
            const categoryExist = await categoryDb.findOne({name : names})
            console.log("exist cat",categoryExist);
            if(categoryExist){
                req.session.errMsg = "Category already exist";
                res.redirect("/admin/add-category");
            }else{
                const newCategory = new categoryDb({name :names});
                newCategory.save()
                req.session.success = "New category added"
                res.redirect("/admin/category")
            }
        }catch(err){
            console.log("Category Added Error",err);
            res.render('500');
        }
    },
    getEditCategory : async(req,res)=>{
        try{
            const category = await categoryDb.findById(req.params.id);
            if(!category){
               req.session.errMsg = "Category Not Found"
               res.redirect('/admin/add-category');
            }
            const exist = req.session.exist;
            req.session.exist = null
            res.render('admin/editCategory',{category,exist})

        }catch(err){
            console.log("Get Edit category Error",err);
            res.render('500');
        }
    },
    editedCategory :async(req,res)=>{
        const {name} = req.body;
        const {id} = req.params;
        const Name = name.toLowerCase();
        try{
            const existCategory = await categoryDb.findOne({name : Name});
            if(existCategory && existCategory._id.toString() !== id){
                req.session.exist = "This Category is already existed"
                res.redirect('/admin/edit-category')
            }else{
               const cat =  await categoryDb.findByIdAndUpdate({_id:id},{name:Name},{new : true})
               if(!cat){
                req.session.errMsg = "Category not found";
                res.redirect('/admin/category')
               }
               req.session.success = "Category Edited Successfully"
               res.redirect('/admin/category');
            }
        }catch(err){
            console.log("edited category error",err);
            res.render('500');
        }
    },
    deleteCategory : async(req,res)=>{
        try{
            console.log("cttggry");
            const id = req.params.id;

            console.log("id",id);

            const catDelete = await categoryDb.findById(id);
            if(!catDelete){
               return res.json({ success: false, message: "user not found" });  
            }else{
                var msg
                console.log("catttIDdd,",catDelete);
                if(catDelete.isActive){
                    await categoryDb.findByIdAndUpdate(id,{isActive:false},{new:true})
                    msg="succusfully blocked"
                    await productDb.updateMany({category:id},{isActive:false},{new:true});
                }else{
                    await categoryDb.findByIdAndUpdate(id,{isActive:true},{new:true})
                    await productDb.updateMany({category:id},{isActive:true},{new:true});
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