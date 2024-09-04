var express = require('express');
var router = express.Router();
const adminController = require('../controller/adminController');
const adminAuth = require('../middlewares/adminAuth');
const productController = require('../controller/productController');
const upload = require('../config/multer');
const categoryController = require('../controller/categoryController');
const userManagement = require('../controller/userManagement');
const brandController = require('../controller/brandController')
const orderController = require('../controller/orderController');
const orderManagement = require('../controller/orderManagement');
const couponController = require('../controller/couponController');

///////////////////Admin Route
/* GET Home Page */
router.get('/',adminAuth.adminExist,adminController.dashboard)
/* GET users listing. */
router.get('/login',adminAuth.adminCheck,adminController.login);
/*  Admin DashBoard */
router.post('/dashboard',adminAuth.adminAuth,adminController.adminPost);
/*  Admin Logout */
router.get('/logout',adminController.logout);


///////////////////Product Route
/*  Product List Page */
router.get('/products',adminAuth.adminExist,productController.productsGet)
/*  Add Products */
router.get('/add-products',adminAuth.adminExist,productController.addProducts)
/*  Product Added */
router.post('/product-added',adminAuth.adminExist,upload.array('images', 10),productController.productAdded)
/* Edit Product */
router.get('/edit-product/:id',adminAuth.adminExist,productController.getEditProduct);
/* Edited Product */
router.post('/product-edited/:id',adminAuth.adminExist,upload.fields([{ name: 'newImages', maxCount: 10 }]),productController.editedProduct);

router.post('/crop-image', upload.single('croppedImage'), productController.cropImage);
/* Soft Delete Product */
router.patch('/deleteProduct/:id',adminAuth.adminExist,productController.deleteProduct);


///////////////////Category Management
/*  Category List Page */
router.get('/category',adminAuth.adminExist,categoryController.getCategory)
/*  Category Add Page */
router.get('/add-category',adminAuth.adminExist,categoryController.addCategory)
router.post('/category-added',adminAuth.adminExist,categoryController.categoryAdded)
/* Edit Category */
router.get('/edit-category/:id',adminAuth.adminExist,categoryController.getEditCategory);
/* Edited Category */
router.post('/category-edited/:id',adminAuth.adminExist,categoryController.editedCategory);
/* Soft Delete category */
router.patch('/deleteCategory/:id',adminAuth.adminExist,categoryController.deleteCategory);


////////////////////Brand Management
/* Brand Get */
router.get('/brand',adminAuth.adminExist,brandController.getBrand);
/*  Brand Add Page */
router.get('/add-brand',adminAuth.adminExist,brandController.addBrand)
router.post('/brand-added',adminAuth.adminExist,brandController.brandAdded)
/* Edit Category */
router.get('/edit-brand/:id',adminAuth.adminExist,brandController.getEditBrand);
/* Edited Category */
router.post('/brand-edited/:id',adminAuth.adminExist,brandController.editedBrand);
/* Soft Delete category */
router.patch('/deleteBrand/:id',adminAuth.adminExist,brandController.deleteBrand);


////////////////////Users Management Admin side
/* User Listing */
router.get('/users',adminAuth.adminExist,userManagement.getUsers);
/* User Status */
router.patch('/updateStatus/:id',adminAuth.adminExist,userManagement.updateStatus);


////////////////////Order Management Admin side
/* Order Listing */
router.get('/order-list',adminAuth.adminExist,orderManagement.getAdminOrderList);
router.post('/order/orderStatus',adminAuth.adminExist,orderManagement.updateOrderStatus);
router.get('/order-view/:id',adminAuth.adminExist,orderManagement.getAdminOrderView);

//accept return request
router.post('/accept-request',adminAuth.adminExist,orderManagement.acceptReturn)

//coupon
router.get('/coupon',adminAuth.adminExist,couponController.getCoupon)

module.exports = router;
