const cartDB = require("../models/cartModel");
const { findById } = require("../models/categoryModel");
const productDB = require("../models/productModel");
const userDB = require("../models/userModel");

module.exports = {
  getCart: async (req, res) => {
    try {
      const userEmail = req.session.email;
      const user = await userDB.findOne({ email: userEmail });

      let cartProduct = await cartDB
        .findOne({ userId: user.id })
        .populate("products.productId");

      if(cartProduct){
      cartProduct.products = cartProduct.products.filter(item => item.productId.isActive);
      console.log("newCArt",cartProduct);
      await cartProduct.save()

      if(cartProduct.products === null){
        await cartDB.findOneAndDelete({ userId: user.id })
      }
   
      if (cartProduct.products !== null && cartProduct.products.length > 0) {

        
      res.render("user/userCart", { user: req.session.username, cartProduct });
      } else {
        res.render("user/userCart", {
          user: req.session.username,
          empty: "Your cart is empty",
        });
      }
    }
      else {
        res.render("user/userCart", {
          user: req.session.username,
          empty: "Your cart is empty",
        });
      }
    
    } catch (err) {
      console.log("error at cart management", err);
      res.render("500");
    }
  },
  addCart: async (req, res) => {
    try {
      const { productId , price, discountAmount } = req.body;
      const userEmail = req.session.email;
      const user = await userDB.findOne({ email: userEmail });

      console.log("discountAmount",discountAmount);
      
      if (!user) {
       return  res.redirect("/");
      } 


        let cart = await cartDB.findOne({ userId: user._id });
        const userProduct = await productDB.findById(productId,{isActive:true});
        
        if(userProduct.stockQuantity===0){
          return res.json({ icon: "warning", msg: "This Product is Out of Stock" });
        }

        if(!cart){         
           cart = await cartDB.create({
            userId: user._id,
            products: [],
          });
        }

        
          const productindex = cart.products.findIndex(
            (p) => p.productId.toString() === productId
          );

          if (productindex > -1) {
            res.json({ icon: "info", msg: "Product Exist in Cart" });
            return;
          } else {
            cart.products.push({ productId, quantity: 1 ,price , discountAmount });
          }
    
            cart.discount = 0;
    
            for(let item of cart.products){
                const productDetails = await productDB.findById(item.productId);
                let itemDiscount = 0;
                if (productDetails.inCategoryOffer === true) {
                    itemDiscount = (productDetails.price - productDetails.discountedPrice) * item.quantity;
                } else if (productDetails.discountAmount > 0) {
                    itemDiscount = productDetails.discountAmount * item.quantity;
                }
                cart.discount += itemDiscount; 
            }
            cart.discount = Number(cart.discount.toFixed(2));

            await cart.save();
        
      
      res.json({ icon: "success", msg: "Product added to Cart" });
    } catch (err) {
      console.log("error at add to cart :", err);
      res.render("500");
    }
  },
  updateCart: async (req, res) => {
    try {
      const id = req.params.id;
      const { productId, quantity } = req.body;
      const userEmail = req.session.email;
      const user = await userDB.findOne({ email: userEmail });

      const userCart = await cartDB.findOne({ userId: user._id });
      const productIndex = userCart.products.findIndex(
        (p) => p.productId.toString() === productId
      );

      if (productIndex > -1) {
        userCart.products[productIndex].quantity = parseInt(quantity);
      }

      await userCart.save();

      const updateCart = await cartDB.findOne({ userId: user._id }).populate('products.productId');
            let subtotal  = updateCart.products.reduce((acc,item) => {
                return acc + (item.quantity * item.productId.price);
            },0);

            const total = subtotal - updateCart.discount;
            const discount = updateCart.discount;
            const productPrice = parseInt(userCart.products[productIndex].quantity) * parseInt(updateCart.products[productIndex].productId.price);
            const discountedAmount =  productPrice - parseInt(userCart.products[productIndex].discountAmount) 
            // console.log("product price",productPrice); 

            userCart.total = total;
            userCart.subTotal = subtotal;
            await userCart.save();
      res.json({ icon: "success", msg: "Cart Updated"  , total : total.toFixed(2) , subtotal : subtotal.toFixed(2) , price : productPrice.toFixed(2),discount : discount.toFixed(2), discountedAmount:discountedAmount.toFixed(2)});
    } catch (err) {
      console.log("error at increase quantity", err);
      res.render("500");
    }
  },

  deleteFromCart: async (req, res) => {
    try {
      const {productId} = req.body;
      const userEmail = req.session.email;
      const user = await userDB.findOne({ email: userEmail });

      const userCart = await cartDB.findOne({ userId: user._id });
      const productIndex = userCart.products.findIndex(
        (p) => p.productId.toString() === productId
      );

      if (productIndex > -1) {
        userCart.discount = userCart.discount - userCart.products[productIndex].discountAmount
        userCart.products.splice(productIndex, 1);
        await userCart.save();
      }
      if(userCart.products.length === 0){
        await cartDB.findOneAndDelete({userId:user._id});
      }
      res.json({ icon: "success", msg: "Product removed from cart" });
    } catch (err) {
      console.log("error at decrease quantity");
      res.render("500");
    }
  },
};

