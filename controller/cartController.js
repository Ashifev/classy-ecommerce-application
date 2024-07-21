const cartDB = require("../models/cartModel");
const product = require("../models/productModel");
const userDB = require("../models/userModel");

module.exports = {
  getCart: async (req, res) => {
    try {
      const userEmail = req.session.email;
      const user = await userDB.findOne({ email: userEmail });

      const cartProduct = await cartDB
        .findOne({ userId: user.id })
        .populate("products.productId");
      console.log("cartProduct", cartProduct);

      if (cartProduct !== null && cartProduct.products.length > 0) {
        res.render("user/userCart", { user: req.session.user, cartProduct });
      } else {
        res.render("user/userCart", {
          user: req.session.user,
          empty: "Your cart is empty",
        });
      }
    } catch (err) {
      console.log("error at cart management", err);
    }
  },
  addCart: async (req, res) => {
    try {
      const { productId } = req.body;
      const userEmail = req.session.email;
      const user = await userDB.findOne({ email: userEmail });

      if (!user) {
        res.redirect("/");
      } else {
        const cart = await cartDB.findOne({ userId: user._id });
        if (cart) {
          const productindex = cart.products.findIndex(
            (p) => p.productId.toString() === productId
          );
          if (productindex > -1) {
            res.json({ icon: "info", msg: "Product Exist in Cart" });
            return;
          } else {
            cart.products.push({ productId, quantity: 1 });
          }
          cart.save();
        } else {
          await cartDB.create({
            userId: user._id,
            products: [
              {
                productId,
                quantity: 1,
              },
            ],
          });
        }
      }
      res.json({ icon: "success", msg: "Product added to Cart" });
    } catch (err) {
      console.log("error at add to cart :", err);
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
      res.json({ icon: "success", msg: "Cart Updated" });
    } catch (err) {
      console.log("error at increase quantity", err);
    }
  },

  decCartQuant: async (req, res) => {
    try {
    } catch (err) {
      console.log("error at decrease quantity");
    }
  },
};
