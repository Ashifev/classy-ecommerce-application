const router = require('express').Router();
const passport = require('passport');
const User = require('../models/userModel');
require('dotenv').config()

//successfully login
router.get("/login/success",async (req,res)=>{
    
    if(req.user){
        // res.status(200).json({
        //     error : false,
        //     message : "Sucessfully Loged In",
        //     user : req.user,
        // });

        const { id, _json: { name, email, picture } } = req.user;

        console.log( name, email,);
        try {
        let existUser = await User.findOne({ email });
            
          if(existUser && existUser.googleId){
            
              req.session.user = existUser
              req.session.email = existUser.email
              req.session.username = req.user.displayName;
              req.session.logged = true;
              console.log('userGname',req.session.user);
              return res.redirect('/');
        }
        const user = new User({
            googleId : id,
            name : name,
            email : email,
            picture : picture
        });

        await user.save()

        const newUser = await User.findOne({email})
        console.log("gUser Saved");     
        req.session.user = newUser
        req.session.email = newUser.email
        req.session.username = req.user.displayName;
        req.session.logged = true;
        console.log('userGname',req.session.user);
        return res.redirect('/');

        } catch(error) {
            console.error("Error saving user goole :",error);
            res.status(500).json({
                error : true,
                message : 'Internal Server Error'
            });
        }

        
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
    console.log("google logout");
    delete req.session.user 
    delete req.session.username 
    delete  req.session.email
    req.session.logged = false
    res.logout();
})

module.exports = router