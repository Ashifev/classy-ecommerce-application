

module.exports = {
    getCoupon : async(req,res)=>{
        try{
            res.render('admin/coupon');
        }catch(err){
            console.log("error getting coupon page");
            
        }
    }
}