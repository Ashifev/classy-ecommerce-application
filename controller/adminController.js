module.exports = {
    login : (req,res)=>{
        try{
            const Err = req.session.adminErr;
            req.session.adminErr = null;
            res.render('admin/adminLogin',{error:Err})
        }catch(err){
            console.log("error at admin login",err);
            res.render('500')
        }
    },
    adminPost: (req,res)=>{
        res.redirect('/admin/');
    },
    dashboard: (req,res)=>{
        try{
            res.render('admin/dashboard');
        }catch(err){
            console.log("error in admin dashboard");
            res.render('500')
        }
    },
    logout: (req,res)=>{
        req.session.destroy((err)=>{
            if(err){
                console.log("logout Error :",err);
                res.redirect('/admin/dashboard')
            }else{
                res.redirect('/admin/login')
            }
        })
    }
}