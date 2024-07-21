const router = require('express').Router();
const passport = require('passport');
require('dotenv').config()

//successfully login
router.get("/login/success",(req,res)=>{
    
    if(req.user){
        // res.status(200).json({
        //     error : false,
        //     message : "Sucessfully Loged In",
        //     user : req.user,
        // });
        req.session.user = req.user.displayName;
        console.log('userGname',req.session.user);
        res.redirect('/');
    }else{
        res.status(403).json({
            error : true,
            message : "Not Authorized"
        })
    }
});

//router for login failed
router.get("/login/failed",(req,res)=>{
    res.status(401).json({
        error : true,
        message : "Login Failed"
    })
});

//router for passport authenticate
router.get("/google",passport.authenticate('google',{
    scope:['email','profile']
}))


//callback router for google oauth
router.get("/google/callback",passport.authenticate(
    'google',{
        successRedirect : process.env.CLIENT_URL,
        failureRedirect : "login/failed"
    }
));

//logout router
router.get("/logout",(req,res)=>{
    res.logout();
})

module.exports = router