
module.exports = {
    getWishList : async(req,res)=>{
        try{
            res.render('user/wishlist')
        }catch(err){
            console.log("error at getting wish list");
            res.render('500')
        }
    }
}