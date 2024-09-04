const Razorpay = require('razorpay');
require("dotenv").config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = {

    createRazorpayOrder : (order) => {

        return new Promise((resolve, reject) => {
            const options = {
                amount: order.amount * 100,
                currency: "INR",
                receipt: order.receipt,
            };

              razorpay.orders.create(options, (err, order) => {
                if (err) {
                    console.error("Error creating Razorpay order:", err);
                    reject(err);
                } else {
                    resolve(order);
                }
                
            })
        })
    }
}