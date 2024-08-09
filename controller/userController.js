const { userExist } = require("../middlewares/userAuth");
const userDB = require("../models/userModel");
const otpDb = require("../models/otpModel");
const productDb = require("../models/productModel");
const addressDb = require("../models/addressModel");
const orderDB = require('../models/orderModel')
const OtpGen = require("../services/otpGenerator");
const nodeMailer = require("../services/nodeMailer");
const bcrypt = require("bcrypt");
const category = require("../models/categoryModel");
const brand = require("../models/brandModel");
const mongoose = require('mongoose');
const createError = require("../config/createError");
require("dotenv").config();
module.exports = {

  //render Home page
  renderHome: async (req, res) => {
    try {
      const product = await productDb.find({ isActive: true }).sort({createdAt:-1}).limit(8);
      res.render("user/homePage", { user: req.session.user, product });
    } catch (err) {
      console.log("error at home rendering", err);
      res.render("500");
    }
  },
  //render signup page
  renderSignup: (req, res) => {
    try {
      let userExist = req.session.userExist;
      req.session.userExist = null;
      res.render("user/userSignup", { error: userExist });
    } catch (err) {
      console.log("error in rendering signup", err);
      res.render("500");
    }
  },
  //render signIn page
  renderLogin: (req, res, next) => {
    try {
      const loginErr = req.session.err;
      const blockMsg = req.session.blockMsg;
      req.session.err = null;
      req.session.blockMsg = null;
      console.log("login error", loginErr);
      res.render("user/userLogin", { error: loginErr, err: blockMsg });
    } catch (error) {
      console.log("error", error);
      // return next(createError(500, ""))
      res.render("500");
    }
  },

  //OTP Generate and User Register
  OtpGenerateRegister: async (req, res) => {
    const { name, password, email } = req.body;
    try {
      console.log("Entered");
      const userExisting = await userDB.findOne({ email });
      const Email = req.body.email;
      console.log(Email);

      if (userExisting) {
        console.log("exist");
        req.session.userExist =
          "This email is already registered. You can signup with another email";
        res.redirect("/signup");
      } else {
        req.session.email = email;
        req.session.user = name;
       

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        //Temperary User Save
        req.session.tempUser = { name, email, password: hashedPassword };
      }
      //Otp generate
      const { OTP } = await OtpGen();

      //Insert Opt document in database
      const salt = await bcrypt.genSalt(10);
      const hashedOtp = await bcrypt.hash(OTP, salt);
      await otpDb.findOneAndUpdate(
        { email },
        { OTP: hashedOtp },
        { upsert: true, new: true }
      );
      console.log("OTP stored in database");

      //send OTP Email
      const otpsent = await nodeMailer.sendOtp(OTP, Email);
      console.log("OTP sent succesfully");

      req.session.userEmail = Email;
      req.session.OTP = OTP;
      console.log(req.session.OTP);

      //Delete Otp document if User didn't enter
      setTimeout(async () => {
        try {
          const otpExist = await otpDb.find({ email });
          if (otpExist) {
            await otpDb.deleteOne({ email: email });
            req.session.OTP = null;
            console.log("OTP Document Deleted");
          }
        } catch (error) {
          console.error("Error deleting OTP document:", error);
          res.render("500");
        }
      }, 2 * 60 * 1000);

      //Render Otp page
      res.redirect("/otp-redirect");
    } catch (error) {
      console.log(error, "Error happened");
      res.render("500");
    }
  },

  //Otp page
  OtpPageRender: (req, res) => {
    try {
        const otpErr = req.session.errMessage;
        req.session.errMessage = null;

        if (!req.session.timerEnd) {
            req.session.timerEnd = Date.now() + 120000; // 2 minutes from now
        }

        const remainingTime = Math.max(req.session.timerEnd - Date.now(), 0);

        res.render("user/otpPage", { error: otpErr, remainingTime });
    } catch (err) {
        console.log("error in otp page rendering", err);
        res.render("500");
    }
},


  //OTP Resend
  OtpResend: async (req, res) => {
    const otpDoc = await otpDb.findOne({ email: { $exists: true } });
    console.log("checking OTP doc :", otpDoc);
    const email = req.session.email;
    console.log("Resend email", email);
    try {
      if (!otpDoc) {
        //Otp generate
        const { OTP } = await OtpGen();
        //Insert Opt document in database
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(OTP, salt);
        await otpDb.findOneAndUpdate(
          { email },
          { OTP: hashedOtp },
          { upsert: true, new: true }
        );
        console.log("OTP stored in database");

        //send OTP Email
        const otpsent = await nodeMailer.sendOtp(OTP, email);
        console.log("OTP sent succesfully");
        req.session.OTP = OTP;
        console.log(req.session.OTP);

        // Reset the timer
        

        setTimeout(async () => {
          try {
            const otpExist = await otpDb.find({ email });
            if (otpExist) {
              await otpDb.deleteOne({ email: email });
              req.session.OTP = null;
              console.log("OTP Document Deleted");
            }
          } catch (error) {
            console.error("Error deleting OTP document:", error);
            res.render("500");
          }
        }, 2 * 60 * 1000);

        req.session.timerEnd = Date.now() + 120000; // 2 minutes from now

        res.redirect("/otp-redirect");
        console.log("OTP Resended");
      } else {
        const otp = req.session.OTP;
        const otpsent = await nodeMailer.sendOtp(otp, email);
        console.log("Resend Otp mail");
      }
    } catch (error) {
      console.log("Resend Error", error);
      res.render("500");
    }
  },

  //OTP Varify
  otpVarify: async (req, res) => {
    const email = req.session.email;
    const { OTP1, OTP2, OTP3, OTP4 } = req.body;
    const otpCode = [OTP1, OTP2, OTP3, OTP4].join("");

    console.log("Recieved Otp :", otpCode, "Email :", email);

    try {
      const user = await otpDb.findOne({ email });

      if (!user) {
        req.session.errMessage = "User is not there";
        return res.redirect("/otp-redirect");
      }

      console.log("thisOtp :", otpCode, "hashed :", user.email);
      const isMatch = await bcrypt.compare(otpCode, user.OTP);

      console.log("isMatch", isMatch);
      if (!isMatch) {
        req.session.errMessage = "Invalid OTP";
        console.log(req.session.errMessage);
        return res.redirect("/otp-redirect");
      }
      const { name, password } = req.session.tempUser;
      const newUser = new userDB({
        name,
        email,
        password,
      });
      await newUser.save();
      await otpDb.deleteOne({ email: email });
      req.session.logged = true;
      res.redirect("/");
    } catch (error) {
      console.log("Error", error);
      res.render("500");
    }
  },

  //shop page render
  shopRender: async (req, res) => {
    try {
      console.log("shop entered user:", req.session.user);
      
      const page = parseInt(req.query.page) || 1;
      const limit = 6;
      const skip = (page - 1) * limit;
      
      const product = await productDb
        .find({ isActive: true })
        .populate("brand")
        .populate("category")
        .limit(limit)
        .skip(skip);
      
      const allCategory = await category.find();
      const allBrand = await brand.find();
      
      const totalProducts = await productDb.countDocuments({ isActive: true });
      const totalPages = Math.ceil(totalProducts / limit);
      
      res.render("user/userShop", {
        user: req.session.user,
        product,
        allBrand,
        allCategory,
        currentPage: page,
        totalPages
      });
    } catch (err) {
      console.log("Error at shopRender", err);
      res.render("500");
    }
  },

  productFilter: async (req, res) => {
    try {
      const { selectedCategories, selectedBrands, maxPrice, page = 1, limit = 6 } = req.query;
      const filter = { isActive: true };

      if (selectedCategories) {
        const categoryName = selectedCategories.split(',');
        const includeCategory = await category.find({ name: { $in: categoryName } }).select('_id');
        const categoryId = includeCategory.map((val) => val._id);
        filter.category = { $in: categoryId };
      }

      if (selectedBrands) {
        const brandName = selectedBrands.split(',');
        const includeBrand = await brand.find({ name: { $in: brandName } }).select('_id');
        const brandId = includeBrand.map((val) => val._id);
        filter.brand = { $in: brandId };
      }

      if (maxPrice) {
        filter.price = { $lte: parseFloat(maxPrice) };
      }

      const totalProducts = await productDb.countDocuments(filter);
      const totalPages = Math.ceil(totalProducts / limit);

      const products = await productDb.find(filter)
        .skip((parseInt(page) - 1) * limit)
        .limit(parseInt(limit))
        .populate("brand")
        .populate("category");

      res.json({
        success: true,
        products,
        currentPage: parseInt(page),
        totalPages,
        totalProducts
      });
    } catch (err) {
      console.log("error at product filter", err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  productSearch: async (req, res) => {
    try {
      const { inputValue, page = 1, limit = 6 } = req.query;
      console.log("query", inputValue);

      if (!inputValue) {
        return res.json({ success: false, message: "No search term provided" });
      }

      const [searchCat, searchBrand, searchProduct] = await Promise.all([
        category.findOne({ name: { $regex: inputValue, $options: "i" } }),
        brand.findOne({ name: { $regex: inputValue, $options: "i" } }),
        productDb.findOne({ name: { $regex: inputValue, $options: "i" } })
      ]);

      const searchOptions = {
        isActive: true,
        $or: [
          { name: { $regex: inputValue, $options: "i" } },
        ],
      };

      if (searchCat) searchOptions.$or.push({ category: searchCat._id });
      if (searchBrand) searchOptions.$or.push({ brand: searchBrand._id });
      if (searchProduct) searchOptions.$or.push({ _id: searchProduct._id });

      console.log("Search options:", searchOptions);

      const totalProducts = await productDb.countDocuments(searchOptions);
      const totalPages = Math.ceil(totalProducts / parseInt(limit));

      const products = await productDb.find(searchOptions)
        .populate("category")
        .populate("brand")
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit));

      console.log("Products found:", products);

      return res.json({
        success: true,
        count: products.length,
        products: products,
        currentPage: parseInt(page),
        totalPages,
        totalProducts
      });
    } catch (err) {
      console.log("error at product search", err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  },

  //Product details
  productDetails: async (req, res) => {
    try {
      const {id} = req.params

      if(!mongoose.Types.ObjectId.isValid(id)){
       res.render("404");
      }
      if (req.session.user) {
       
        console.log("params",req.params.id);
        console.log("productID : ",id);
        const products = await productDb
          .findById(id)
          .populate("category")
          .populate("brand");
          const categoryId = products.category;
        const relateProduct = await productDb.find({category:categoryId,
          _id: { $ne: id },
          isActive: true,
        });
        console.log("this re;lated productss",relateProduct);
        if (!products) {
          console.log("no products found");
          return res.json({ success: false, message: "products not found" });
        } else if (products) {
          console.log("product dtails");
          res.render("user/productDetails", {
            user: req.session.user,
            products,
            relateProduct,
          });
        }
      } else {
        res.redirect("/login");
      }
    } catch (err) {
      console.log("Error at product details", err);
      // return next(createError(500, "somthing went wron"))
      res.render("500");
    }
  },

  profileRender: async (req, res) => {
    try {
      const err = req.session.err;
      const success = req.session.success;
      console.log("req.session.user",req.session.user);
      console.log("req.session.email",req.session.email);
      req.session.success = null
      req.session.err = null;

      const userEmail = req.session.email;
      console.log("profile render req user");
      const profile = await userDB.findOne({ email: userEmail });
      const userId = profile._id;
      const address = await addressDb.find({ userId: userId });
      const orderData = await orderDB.find({userId:userId}).populate('productItems.productId').sort({dateOrdered:-1})
      console.log("profile adress");
      console.log("profile");
      res.render("user/userProfile", {
        user: req.session.user, 
        profile,
        userEmail,
        address,
        orderData,
        err: err,
        success:success
      });
    } catch (err) {
      console.log("error in profile render");
      res.render("500");
    }
  },
  editedProfile: async (req, res) => {
    const { name, email } = req.body;
    try {
      const userEdit = await userDB.findOne({ email: email });
      console.log("reqqq", req.body);
      console.log("UserEdit", userEdit);
      if (!userEdit) {
        console.log("User not found");
        return res.redirect("/profile");
      }
      const updateUser = await userDB.updateOne(
        { name: userEdit.name },
        { name: name },
        { new: true }
      );
      req.session.user = name;
      console.log("updated", updateUser);
      req.session.success = "Profile changed successfully";
      res.redirect("/profile");
    } catch (err) {
      console.log("err in user profile edit", err);
      res.render("500");
    }
  },
  password:async(req,res)=>{
    try{
      const userEmail = req.session.email;
      res.render('user/password',{userEmail});
    }catch(err){
      console.log("error at password",err);
    }
  },
  changePassword: async (req, res) => {
    const id = req.params.id;
    try {
      console.log("password change redirect");
      const { oldpassword, newpassword, confirmpassword } = req.body;
      
      if (newpassword !== confirmpassword) {
        req.session.error = "New password and confirm password do not match.";
        return res.redirect('/profile');
      }
  
      const user = await userDB.findOne({ email: id });
  
      if (!user) {
        req.session.error = "User not found.";
        return res.redirect('/profile');
      }
  
      const matchPass = await bcrypt.compare(oldpassword, user.password);
      console.log("user pass :", user.password);
      console.log("req pass", oldpassword);
      console.log("matching", matchPass);
  
      if (!matchPass) {
        req.session.err = "Old password is incorrect.";
        console.log("Incorrect Password");
        return res.redirect('/profile');
      }
  
      console.log("password changed");
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newpassword, salt);
      await userDB.updateOne({ _id: user._id }, { $set: { password: hashedPassword } });
  
      req.session.success = "Password Changed Successfully";
      res.redirect('/profile');
    } catch (err) {
      console.log("error in change password: ", err);
      req.session.err = "An error occurred while changing the password.";
      res.redirect('/profile');
    }
  },
  //forgot password
  getForgetEmail : async (req,res)=>{
    try{
      const err = req.session.error;
      req.session.error = null
      res.render("user/forgotMailPage",{err : err})
    }catch(err){
      console.log("error at forget pass email send");
    }
  },
  forgetOtpSendMail : async(req,res)=>{
    try{
      console.log("forget otp and send mail");
      const {email} = req.body;
      req.session.forgotEmail = email;
      const userExisting = await userDB.findOne({ email })
      if(!userExisting){
        req.session.error = "User not found";
        return res.redirect("/forgot-email")
      }else{
        const { OTP } = await OtpGen();
        console.log("otp",OTP);
      //Insert Opt document in database
      const salt = await bcrypt.genSalt(10);
      const hashedOtp = await bcrypt.hash(OTP, salt);
      await otpDb.findOneAndUpdate(
        { email },
        { OTP: hashedOtp },
        { upsert: true, new: true }
      );
      console.log("OTP stored in database");

      //send OTP Email
      const otpsent = await nodeMailer.sendOtp(OTP, email);
      console.log("OTP sent succesfully");
      res.redirect("/forgot-otp")
      }

      //Delete Otp document if User didn't enter
      setTimeout(async () => {
        try {
          const otpExist = await otpDb.find({ email });
          if (otpExist) {
            await otpDb.deleteOne({ email: email });
            req.session.OTP = null;
            console.log("OTP Document Deleted");
          }
        } catch (error) {
          console.error("Error deleting OTP document:", error);
          res.render("500");
        }
      }, 2 * 60 * 1000);

    }catch(err){
      console.log("error at forget otp generate and mail send");
      res.render("500");
    }
  },
  forgotOtpGet : async(req,res)=>{
    try{
      const error = req.session.error;
      req.session.error = null
      res.render('user/forgotOtp',{error:error})
    }catch(err){
      console.log("error at forgot Otp page get");
      res.render("500");
    }
  },
  forgotOtpVarify : async(req,res)=>{
    try{
      const {OTP1, OTP2, OTP3, OTP4} = req.body;
      const otpCode = [OTP1, OTP2, OTP3, OTP4].join("");
      const email = req.session.forgotEmail;
      
      console.log("Recieved OTp",otpCode);

      const user = await otpDb.findOne({ email });
      if (!user) {
        req.session.error = "User is not there";
        return res.redirect("/forgot-email");
      }

      console.log("thisOtp :", otpCode, "hashed :", user.email);
      const isMatch = await bcrypt.compare(otpCode, user.OTP);
      console.log("isMatch",isMatch);
      if(!isMatch){
        req.session.error = "invalid otp";
        console.log(req.session.error);
        return res.redirect("/forgot-otp");
      }
      res.redirect('/forgot-password');
    }catch(err){
      console.log("error at forget OTP varification");
      res.render("500");
    }
  },
  forgetPasswordForm : async(req,res)=>{
    try{
      const err = req.session.error;
      req.session.error = null
      res.render('user/forgot-password',{err:err})
    }catch(err){
      console.log("error at forgot password form",err);
    }
  },
  confirmForgotPass : async(req,res)=>{
    try{
      const {newpassword, confirmpassword} = req.body;
      const email = req.session.forgotEmail;
      req.session.forgotEmail = null;
      if (newpassword !== confirmpassword) {
        req.session.error = "New password and confirm password do not match.";
        return res.redirect('/forgot-password');
      }
      const user = await userDB.findOne({email:email})
      console.log("user is here for forget :",user);

      if (!user) {
        req.session.error = "User not found.";
        return res.redirect('/forgot-email');
      }
      console.log("password changed");
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newpassword, salt);
      await userDB.updateOne({ _id: user._id }, { $set: { password: hashedPassword } });

      req.session.success = "Password Changed Successfully";
      res.redirect('/login');
    }catch(err){
      console.log("error at confirm forgot password",err);
      res.render("500");
    }
  },
  //User Validation
  userLogin: async (req, res) => {
    const { email, password } = req.body;
    try {
      const User = await userDB.findOne({ email });
      console.log(User);

      if (!User) {
        console.log("user not found");
        req.session.err = "Invalid email address";
        return res.redirect("/login");
      }
      if (User.status) {
        const isPassword = await bcrypt.compare(password, User.password);
        console.log("Password Matching is :", isPassword);

        if (isPassword) {
          req.session.user = User.name;
          req.session.email = User.email;
          req.session.logged = true;
          return res.redirect("/");
        } else {
          req.session.err = "Invalid email or password";
          res.redirect("/login");
        }
      } else {
        console.log("user blocked");
        req.session.blockMsg = "Sorry, you have been blocked";
        return res.redirect("/login");
      }
    } catch (error) {
      console.log("Error :", error);
      res.render("500");
    }
  },

  //logout
  logout: (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.log("error :", err);
        } else {
          res.redirect("/");
          console.log("User Logout");
        }
      });
    } catch (err) {
      console.log("error in logout", err);
      res.render("500");
    }
  },
};
