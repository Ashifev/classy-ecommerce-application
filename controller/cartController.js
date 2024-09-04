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
   
      if (cartProduct.products !== null && cartProduct.products.length > 0) {
        res.render("user/userCart", { user: req.session.username, cartProduct });
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
      const { productId , price } = req.body;
      const userEmail = req.session.email;
      const user = await userDB.findOne({ email: userEmail });

      if (!user) {
        res.redirect("/");
      } else {
        const cart = await cartDB.findOne({ userId: user._id });
        const userProduct = await productDB.findById(productId,{isActive:true});
        if(userProduct.stockQuantity===0){
          return res.json({ icon: "warning", msg: "This Product is Out of Stock" });
        }
        if (cart) {
          const productindex = cart.products.findIndex(
            (p) => p.productId.toString() === productId
          );
          if (productindex > -1) {
            res.json({ icon: "info", msg: "Product Exist in Cart" });
            return;
          } else {
            cart.products.push({ productId, quantity: 1 ,price });
          }
          cart.save();
        } else {
          await cartDB.create({
            userId: user._id,
            products: [
              {
                productId,
                quantity: 1,
                price
              },
            ],
          });
        }
      }
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
            const subtotal  = updateCart.products.reduce((acc,item) => {
                return acc + (item.quantity * item.productId.price);
            },0);

            const total = subtotal;
            
            const productPrice = parseInt(userCart.products[productIndex].quantity) * parseInt(updateCart.products[productIndex].productId.price);
            console.log("product price",productPrice); 

      res.json({ icon: "success", msg: "Cart Updated"  , total : total.toFixed(2) , subtotal : subtotal.toFixed(2) , price : productPrice.toFixed(2)});
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
        userCart.products.splice(productIndex, 1);
        await userCart.save();

      }
      res.json({ icon: "success", msg: "Product removed from cart" });
    } catch (err) {
      console.log("error at decrease quantity");
      res.render("500");
    }
  },
};
