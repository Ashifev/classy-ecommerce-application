module.exports = {
    getWallet : async(req,res)=>{
        try{
            
        }catch(err){
            console.log("error at getting wallet",err);
            res.render('500');
        }
    }
}