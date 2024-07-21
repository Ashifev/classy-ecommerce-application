module.exports = {
    login : (req,res)=>{
        const Err = req.session.adminErr;
        req.session.adminErr = null;
        res.render('admin/adminLogin',{error:Err})
    },
    adminPost: (req,res)=>{
        res.redirect('/admin/');
    },
    dashboard: (req,res)=>{
        res.render('admin/dashboard');
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