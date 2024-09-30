var express = require('express');
var router = express.Router();
const userAuth = require('../middlewares/userAuth')
const userController = require('../controller/userController')
const addressController = require('../controller/addressControl')
const cartController = require('../controller/cartController');
const methodOverride = require('method-override');
const orderController = require('../controller/orderController');
const paymentController = require('../controller/paymentController');
const wishlistController = require('../controller/wishlistController');
const walletController = require('../controller/walletController');
const couponController = require('../controller/couponController');


/* GET Guest page. */
router.get('/',userController.renderHome);

/* GET Signup page. */
router.get('/signup',userAuth.userExist,userController.renderSignup);
/* GET Signup page. */
router.get('/login',userAuth.userExist,userController.renderLogin);


/*Home page. */
router.post('/home',userController.userLogin,userController.renderHome);


///////////////OTP ROUTE
/*OTP page. */
router.post('/otp-page',userController.OtpGenerateRegister);
/*OTP page. */
router.get('/otp-redirect',userController.OtpPageRender)
/*OTP Resend. */
router.get('/otp-resend',userController.OtpResend);
/*OTP Varify. */
router.post('/otp-varify',userController.otpVarify);

/////////////////////Products
/*Shop page render */
router.get('/shop',userAuth.userAuthentication,userController.shopRender);
router.get('/product-details/:id',userAuth.userAuthentication,userController.productDetails);

/////////////////////////User Profile
/*User Profile page render */
router.get('/profile',userAuth.userAuthentication,userController.profileRender);
//user profile edit
router.post('/edit-profile',userAuth.userAuthentication,userController.editedProfile);
//password change
router.get('/password',userAuth.userAuthentication,userController.password);
//password change
router.post('/change-password/:id',userAuth.userAuthentication,userController.changePassword);


//forget password
router.get("/forgot-email",userController.getForgetEmail)
router.post("/forgot-otp",userController.forgetOtpSendMail)
router.get("/forgot-otp",userController.forgotOtpGet)
router.post("/forgot-varify",userController.forgotOtpVarify)
router.get("/forgot-password",userController.forgetPasswordForm)
router.post("/forgot-password",userController.confirmForgotPass)

///get address page
router.get('/add-address',userAuth.userAuthentication,addressController.getAddressPage)
//Save Address
router.post('/save-address/:id',userAuth.userAuthentication,addressController.saveAddress);
router.post('/edit-address/:id',userAuth.userAuthentication,addressController.editAddress);
///get address by id
router.get('/address/:id',userAuth.userAuthentication,addressController.getAddressById);
//address soft deletion
router.patch('/deleteAddress/:id',userAuth.userAuthentication,addressController.deleteAddress)

//get User Cart Page
router.get('/shopping-cart',userAuth.userAuthentication,cartController.getCart);
router.post('/add-cart',userAuth.userAuthentication,cartController.addCart);
router.post('/update-cart/:id',userAuth.userAuthentication,cartController.updateCart);
router.post('/delete-cart/:id',userAuth.userAuthentication,cartController.deleteFromCart);

//user checkout
router.get('/checkout',userAuth.userAuthentication,orderController.getCheckout)
router.post('/submit-order',userAuth.userAuthentication,orderController.orderSubmit)
router.get('/order-placed/:id',userAuth.userAuthentication,orderController.orderplaced)
router.get('/order-details/:id',userAuth.userAuthentication,orderController.getOrderDetails)
router.post('/order-cancel/:id',userAuth.userAuthentication,orderController.orderCancel)
router.post('/cancel-item',userAuth.userAuthentication,orderController.itemCancel)
router.post('/return-item',userAuth.userAuthentication,orderController.itemReturn)
router.post('/save-order',userAuth.userAuthentication,orderController.saveFailedOrder)
//razorpay
router.get("/razor-key",userAuth.userAuthentication,paymentController.getKey)
router.post("/razor-order",userAuth.userAuthentication,paymentController.createRazerPayOrder)
router.post("/razor-varify",userAuth.userAuthentication,paymentController.verifyPayment)
router.post("/failedOrder",userAuth.userAuthentication,paymentController.verifyPaymentFailedPayment)
router.post("/failed-order-submit",userAuth.userAuthentication,orderController.failedOrderSubmit)

//filtering and search
router.get('/filter-product',userAuth.userAuthentication,userController.productFilter)
router.post('/searchProduct',userAuth.userAuthentication,userController.productSearch)

//wallet router
router.get('/wallet',userAuth.userAuthentication,walletController.getWallet)

//wishlist router
router.get('/wishlist',userAuth.userAuthentication,wishlistController.getWishList)
router.get('/get-wishlist',userAuth.userAuthentication,wishlistController.fetchWishList)
router.post('/add-to-wishlist',userAuth.userAuthentication,wishlistController.addWishToWishList);
router.post('/delete-wishlist',userAuth.userAuthentication,wishlistController.removeFromWishlist);
router.post('/remove-wishlist',userAuth.userAuthentication,wishlistController.removeFromWishlist);

// coupons
router.post('/applycoupon',couponController.applyCoupon);
router.post('/removecoupon',couponController.removeCoupon);

// invoice
router.get('/generateInvoice/:orderId',orderController.generateInvoice);

// download invoice
router.get('/downloadInvoice/:orderId',orderController.downloadInvoice);

//logout
router.get("/logout",userController.logout) 


module.exports = router;