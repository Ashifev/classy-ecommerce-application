const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require('passport');
require('dotenv').config();

passport.use(
    new GoogleStrategy(
        {
            clientID : process.env.CLIENT_ID,
            clientSecret : process.env.CLIENT_SECRET,
            callbackURL : "http://localhost:3000/auth/google/callback",
            scope:['email','profile']
        },
        function(accessToken,refreshToken,profile,callback){
            console.log('Profile Data');
            console.log(profile);
            callback(null,profile);
        }
    )
);

passport.serializeUser((user,done)=>{
    done(null,user);
});

passport.deserializeUser((user,done)=>{
    done(null,user);
})