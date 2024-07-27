const { findById } = require("../models/userModel");
const userDB = require("../models/userModel");
const addressDb = require("../models/addressModel");

module.exports = {
  getAddressPage:async(req,res)=>{
    const userEmail = req.session.email;
    try{
      res.render('user/userAddress',{userEmail});
    }catch(err){
      console.error("some error when rendering the profileAddress",err);
      res.render('500');
    }
  },
  saveAddress: async (req, res) => {
    console.log("address save");
    const {
      name,
      mobile,
      address,
      pincode,
      locality,
      city,
      state,
      landmark,
      alternateMobile,
    } = req.body;

    const id = req.params.id;
    console.log("id", id);
    try {
      const userEmail = await userDB.findOne({ email: id });
      const userId = userEmail._id;
      console.log("user Id", userId);

      // Check the number of addresses already saved for this user
      const addressCount = await addressDb.countDocuments({ userId: userId });
      if (addressCount >= 4) {
        req.session.err = "User can only save up to 4 addresses"
        res.redirect('/profile')
        return res.status(400).send("User can only save up to 4 addresses");
      }

      if (userId.id) {
        const newAddress = await new addressDb({
          userId: userId,
          name,
          mobile,
          address,
          pincode,
          locality,
          city,
          state,
          landmark,
          alternateMobile,
        });
        await newAddress.save();
        req.session.success = "address added successfully";
        res.redirect('/profile')
      }
    } catch (err) {
      console.log("address save error", err);
      res.render("500");
    }
  },
  getAddressById: async(req,res)=>{
    try {
      const address = await addressDb.findById(req.params.id);

      console.log(address,"address fetch by id");
      if (!address) {
          return res.status(404).send();
      }
      res.render('user/editAddress',{address})
  } catch (error) {
      res.status(500).send(error);
  }
  },
  editAddress: async (req, res) => {
    console.log("edit address",req.body);
    const {
      name,
      mobile,
      address,
      pincode,
      locality,
      city,
      state,
      landmark,
      alternateMobile,
    } = req.body;

    const id = req.params.id;
    console.log("id", id);
    try {
      const userAddress = await addressDb.findByIdAndUpdate(
        id, 
        {
          name: name,
          mobile: mobile,
          address: address,
          pincode: pincode,
          locality: locality,
          city: city,
          state: state,
          landmark: landmark,
          alternateMobile: alternateMobile
        },
        { new: true } // This option ensures that the updated document is returned
      );
      console.log('Updated Address:', userAddress);
      req.session.success = "address changed successfully";
      res.redirect('/profile',)

    } catch (err) {
      console.log("address save error", err);
      res.render("500");
    }
  },
  deleteAddress : async(req,res)=>{
    try{
      console.log("category soft deletion");
      const id = req.params.id;
      const address = await addressDb.findById(id);
      if(!address){
        return res.json({ success: false, message: "user not found" });
      }else{
        var msg;
        if(address.isActive){
          await addressDb.findByIdAndDelete(id);
          msg = "Address Deleted Successfully"
        }
      }
      res.json({ success: true, msg })
    }catch(err){
      console.log("Error at address soft delete",err);
      res.render('500')
    }
  }
};
