const brandDb = require('../models/brandModel');

module.exports = {
    getBrand : async(req,res)=>{
        try{
            const success = req.session.success;
            req.session.success = null;
            const brand = await brandDb.find();
            res.render('admin/brand',{brand,success})
            
        }catch(err){
            console.log("error in get brand :",err);
            res.render('500');
        }
    },
    addBrand : (req,res)=>{
        try{
            const err = req.session.errMsg;
            req.session.errMsg = null
            res.render('admin/addBrand',{err})
        }catch(err){
            console.log("error in add brand :",err);
            res.render('500');
        }
    },
    brandAdded: async(req,res)=>{
        const {name} = req.body;
        const names = name.toUpperCase();
        console.log("req body",req.body);
        try{
            console.log("body name",names);
            const brandExist = await brandDb.findOne({name : names})
            console.log("exist cat",brandExist);
            if(brandExist){
                req.session.errMsg = "Brand already exist";
                res.redirect("/admin/add-brand");
            }else{
                const newCategory = new brandDb({name :names});
                newCategory.save()
                req.session.success = "New Brand added"
                res.redirect("/admin/brand")
            }
        }catch(err){
            console.log("Brand Added Error",err);
            res.render('500');
        }
    },
    getEditBrand: async(req,res)=>{
        try{
            const brand = await brandDb.findById(req.params.id);
            if(!brand){
               req.session.errMsg = "Brand Not Found"
               res.redirect('/admin/add-brand');
            }
            const exist = req.session.exist;
            req.session.exist = null
            console.log("get edit brand");
            res.render('admin/editBrand',{brand,exist})

        }catch(err){
            console.log("Get Edit Brand Error",err);
            res.render('500');
        }
    },
    editedBrand :async(req,res)=>{
        const {name} = req.body;
        const {id} = req.params;
        const Name = name.toUpperCase();
        try{
            const existBrand = await brandDb.findOne({name : Name});
            if(existBrand && existBrand._id.toString() !== id){
                req.session.exist = "This Brand is already existed"
                res.redirect('/admin/edit-brand')
            }else{
               const brand =  await brandDb.findByIdAndUpdate({_id:id},{name:Name},{new : true})
               if(!brand){
                req.session.errMsg = "Brand not found";
                res.redirect('/admin/brand')
               }
               req.session.success = "Brand Edited Successfully"
               res.redirect('/admin/brand');
            }
        }catch(err){
            console.log("edited brand error",err);
            res.render('500');
        }
    },
    deleteBrand : async(req,res)=>{
        try{
            console.log("brandddd");
            const id = req.params.id;

            console.log("id",id);

            const brandDelete = await brandDb.findById(id);
            if(!brandDelete){
               return res.json({ success: false, message: "user not found" });  
            }else{
                var msg
           
            console.log("catttIDdd,",brandDelete);
                if(brandDelete.isActive){
                    await brandDb.findByIdAndUpdate(id,{isActive:false},{new:true})
                    msg="succusfully blocked"
            
                }else{
                    await brandDb.findByIdAndUpdate(id,{isActive:true},{new:true})
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
