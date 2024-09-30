const RazorPay = require("razorpay");
const crypto = require("crypto");

const Wallet = require("../models/walletModel");
const Order = require("../models/orderModel");

exports.createRazerPayOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    console.log("amt",amount);
    
    const instance = new RazorPay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: crypto.randomBytes(10).toString("hex"),
    };

    instance.orders.create(options, (error, order) => {
      if (error) {
        console.log("in err",error);
        throw Error(error);
      }
      console.log("create razorpay order",order);
      
      res.status(200).json({ order });
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature,orderId, wallet} =
      req.body;
    console.log("entrrt varify payment ",req.body);

    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      throw Error("Invalid Signature sent");
    }

 

    return res
      .status(200)
      .json({ message: "Payment verified successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getKey = (req, res) => {
    console.log("key royt");
    
  return res.status(200).json({ key: process.env.RAZORPAY_KEY_ID });
};

// exports.addMoneyWallet = async (req, res) =>{
//   try{
//     const userId = req.session.userId;

//     if(!userId){
//         return res.status(401).json({ error: "User not authenticated" });
//     }
//     const { amount } = req.body;

//       let counter = await Counter.findOne({
//         model: "Wallet",
//         field: "transaction_id",
//       });

//       // Checking if order counter already exist
//       if (counter) {
//         counter.count += 1;
//         await counter.save();
//       } else {
//         counter = await Counter.create({
//           model: "Wallet",
//           field: "transaction_id",
//         });
//       }

//       let wallet = {};
//       const exists = await Wallet.findOne({ user: userId });
//       if (exists) {
//         wallet = await Wallet.findByIdAndUpdate(exists._id, {
//           $inc: {
//             balance: amount,
//           },
//           $push: {
//             transactions: {
//               transaction_id: counter.count + 1,
//               amount: amount,
//               type: "credit",
//               description: "Wallet Recharged",
//             },
//           },
//         });
//       } else {
//         wallet = await Wallet.create({
//           user: userId,
//           balance: amount,
//           transactions: [
//             {
//               transaction_id: counter.count + 1,
//               amount:amount,
//               type: "credit",
//               description: "Wallet Recharged",
//             },
//           ],
//         });
//       }
//       return res.status(200).json({amount:amount})
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// }

// exports.verifyPaymentFailedPayment = async (req, res) =>{
//   try {
//     const userId = req.session.userId;

//     const { error: { metadata: { payment_id, order_id } }, orderId } = req.body;

//     const order = await Order.findOne({orderId});

//     await Payment.create({
//       payment_id: payment_id,
//       razorpay_order_id: order_id,
//       orderId,
//       amount: order.totalPrice,
//       user: userId,
//       status: "failed",
//       paymentMode: "razorPay",
//     });

//     return res.status(200).json({ success: true, message: "Failed payment recorded" })
//   } catch (error) {
//     res.status(500).json({message: "somthing went wrong"});  
//   }
// }

exports.verifyPaymentFailedPayment = async (req, res) =>{
  try {
    console.log("failed order enter here");
    
    const userId = req.session.user._id;
    console.log("req.body : ",req.body);

    const { error: { metadata: { payment_id, order_id } }, orderId } = req.body;


    // return res.status(200).json({ success: true, message: "Failed payment recorded" })
    res.redirect('/failed-order-submit');
  } catch (error) {
    res.status(500).json({message: "somthing went wrong"});  
  }
}