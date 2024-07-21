require ('dotenv').config();

module.exports = {
    adminAuth : (req,res,next)=>{
        const {admin_email,admin_pass} = process.env;
        if(req.body.email === admin_email && req.body.password === admin_pass){
            req.session.admin = true;
            next(); 
        }else{
            req.session.adminErr = "Invalid Email/Password"
            res.redirect('/admin/login')
        }
    },
    adminCheck :(req,res,next)=>{
        if(req.session.admin){
            res.redirect('/admin/')
        }else{
            next();
        }
    },
    adminExist:(req,res,next)=>{
        if(req.session.admin){
            next();
        }else{
            res.redirect('/admin/login')
        }
    }
}