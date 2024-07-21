const userDb = require('../models/userModel');

module.exports = {
    getUsers : async (req,res)=>{
        try{
            const user = await userDb.find();
            res.render('admin/users',{user})
        }catch(err){
            console.log("Get User Error",err);
            res.render('500');
        }
    },
    updateStatus : async(req,res)=>{
        try{
            console.log("ghhghg");
            const id = req.params.id;

            console.log("id",id);

            const userBlock = await userDb.findById(id);
            if(!userBlock){
               return res.json({ success: false, message: "user not found" });  
            }else{
                var msg
           
            console.log("heyyyyyyyyyyyyyyyy,",userBlock);
                if(userBlock.status){
                    await userDb.findByIdAndUpdate(id,{status:false},{new:true})
                    msg="succusfully blocked"
            
                }else{
                    await userDb.findByIdAndUpdate(id,{status:true},{new:true})
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