const session = require('express-session');

module.exports={

    userAuthentication : (req,res,next)=>{
        if(req.session.logged){
            next();
        }else{
            return res.redirect('/login')
        }
    },

    userExist : (req,res,next)=>{
        if(req.session.logged){
            console.log("User Exist");
            return res.redirect('/')
        }else{        
            next();
        }
    }
}