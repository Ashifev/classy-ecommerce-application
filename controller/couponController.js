const couponDB = require('../models/couponModel');
const cartDB = require('../models/cartModel');
module.exports = {
    getCoupon : async(req,res)=>{
        try{
            const err = req.session.err;
            const success = req.session.success;
            req.session.success = null;
            req.session.err = null;
            const coupon = await couponDB.find();
            if(!coupon){
                return res.render('admin/coupon',{err:"Coupon not Founded"})
            }
            console.log("hereeee");
            
            res.render('admin/coupon',{err,success,coupon});
        }catch(err){
            console.log("error getting coupon page");
            
        }
    },
    addCouponGet: async(req,res)=>{
        try{
            res.render("admin/addCoupon",{err:null});
        }catch(err){
            console.log("error at getting add coupon",err);
            res.render('500');
        }
    },
    couponAdded: async(req,res)=>{
        try{
            var {
                couponName,
                couponCode,
                description,
                minPurchaseAmount,
                discountAmount,
                validFrom,
                validTo
            } = req.body;
            minPurchaseAmount = parseInt(minPurchaseAmount)
            discountAmount = parseInt(discountAmount)

            console.log("req.body",req.body);
            
            const couponExist = await couponDB.findOne({couponCode});
            if(couponExist){
                req.session.err = "Coupon is already Exist";
                return res.redirect('/admin/coupon')
            }
            const newCoupon = await couponDB.create({
                couponName,
                couponCode,
                description,
                minPurchaseAmount,
                discountAmount,
                validFrom,
                validTo
            })
            req.session.success = "New Coupon added successfully";
        }catch(err){
            console.log("error at coupon added controller",err);
            res.render('500')
            
        }
    },
    getEditCoupon : async(req,res)=>{
        try {
            const couponId = req.params.id;
            
            const coupon = await couponDB.findById(couponId);
            console.log(coupon,"edit gettttt");

            if (!coupon) {
                req.session.err = "Coupon not found";
                return res.redirect('/admin/coupon')
            }

            res.render('admin/editCoupon',{err:null,coupon})

        } catch(error){
            console.error("Error while getting the edit coupon",error);
            res.status(500).render('500');
        }
    },
    couponEdited : async(req,res)=>{
        try{
            
            const couponId = req.params.id;
            console.log("enter coupon edited function");
            
            const {
                couponName,
                couponCode,
                description,
                minPurchaseAmount,
                discountAmount,
                validFrom,
                validTo
            } = req.body;


            const existingCoupon = await couponDB.findOne({ couponCode, _id: { $ne: couponId } });
            if (existingCoupon) {
                return res.render('admin/coupon',{err:"Coupon code already exists"})
            }

            console.log("enter second step inedited coupn");
            

            const coupon = await couponDB.findByIdAndUpdate(
                couponId,
                {
                    couponName,
                    couponCode,
                    description,
                    minPurchaseAmount,
                    discountAmount,
                    validFrom,
                    validTo
                },
                {
                    new : true
                }
            )
            console.log(coupon,"updted successflully");

            if(!coupon){
                return res.render('admin/coupon',{err:"Coupon Not Found"})
            }
            req.session.success = "Successfully updated the coupon"
            res.redirect('/admin/coupon')
        }catch(Err){
            console.log("error at coupon edited",Err);
            res.render('500');
        }
    },
    deleteCoupon : async(req,res)=>{
        try{
            const couponId = req.params.id;
            const coupon = await couponDB.findById(couponId);
            if(!coupon){
                return res.json({ success: false, msg: "coupon not found" })
            }
            if(coupon){
                await couponDB.findByIdAndDelete(couponId)
                res.json({ success: true, msg: "coupon deleted successfully" });
            }
        }catch(err){
            console.log("error at delete coupon",err);
            res.render('500')
        }
    },
    applyCoupon : async(req,res)=>{
        try{
            const {couponCode} = req.body;
            const userId = req.session?.user?._id;

            const cart = await cartDB.findOne({userId}).populate('products.productId');
            if(req.session.appliedCoupon){
                return res.status(404).json({success:false, message:"A Coupon is allready applied"})
            }
            var subTotal = cart.products.reduce((price,curr) => {
                return price + curr.price * curr.quantity
            },0);

            const totalPrice = subTotal - cart.discount;
            const coupon = await couponDB.findOne({couponCode});

            if(!coupon || coupon.minPurchaseAmount > totalPrice){
                return res.json({ success: false, message: 'Invalid coupon or minimum purchase amount not met' })
            }
            const discountAmount = coupon.discountAmount;
            const newTotal = totalPrice - discountAmount;
    
            console.log("new total",newTotal);
            console.log("totalPrice",totalPrice);
            
            req.session.appliedCoupon = {
                couponCode,
                discountAmount,
                newTotal
            };

            console.log("coupon applied",req.session.appliedCoupon);
            
    
            res.json({ success: true, discountAmount, newTotal });

        }catch(err){
            console.log("error at coupon apply",err);
            res.render('500')
        }
    },
    removeCoupon : async(req,res)=>{
        try{
            const userId = req.session.user;
            if(!req.session.appliedCoupon){
                res.status(400).json({success: false, message: "No coupon is currently applied"});
            }
            const cart = await cartDB.findOne({userId}).populate('products.productId');
            console.log("removing cart",cart);
            if(!cart){
                res.status(404).json({success:false, message:"no cart found"})
            }
            var subTotal = cart.products.reduce((price,curr) => {
                return price + curr.price * curr.quantity
            },0);

            const totalPrice = subTotal - cart.discount;
            const newTotal = totalPrice;
            delete req.session.appliedCoupon;

            res.status(200).json({
                success: true,
                newTotal : newTotal,
                message : "coupon removed successfully"
            })
            
        }catch(err){
            console.log("error at coupon removing :",err);
            res.render('500')
        }
    }
}