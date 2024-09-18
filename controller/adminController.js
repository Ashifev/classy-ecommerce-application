const {generateSalesPDF} = require('../services/pdfCreator');
const orderDB = require('../models/orderModel');
const user = require('../models/userModel');
const excel = require('../services/excelCreator');

module.exports = {
    login : (req,res)=>{
        try{
            const Err = req.session.adminErr;
            req.session.adminErr = null;
            res.render('admin/adminLogin',{error:Err})
        }catch(err){
            console.log("error at admin login",err);
            res.render('500')
        }
    },
    adminPost: (req,res)=>{
        res.redirect('/admin/');
    },
    dashboard: async (req,res)=>{
        try{
            const err = req.session.err;
            const success = req.session.success;
            req.session.err = null;
            req.session.success = null;
            const currentDate = new Date();
            const lastWeekDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
            const lastMonthDate = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
            const lastYearDate = new Date(currentDate.getTime() - 365 * 24 * 60 * 60 * 1000);

            const salesData = await orderDB.aggregate([
                {
                    $match : {
                        status : "Delivered",
                        dateOrdered : {$exists : true,$ne : null}
                    }
                },
                {$facet: {
                    lastWeek: [
                        { $match: { dateOrdered : { $gte: lastWeekDate } } },
                        { $group: { _id: null, total: { $sum: "$totalPrice" } } }
                    ],
                    previousWeek : [
                        { $match: { dateOrdered : { $gte: new Date(lastWeekDate.getTime() - 7 * 24 * 60 * 60 * 1000), $lt: lastWeekDate } } },
                        { $group: { _id: null, total: { $sum: "$totalPrice" } } }
                    ],
                    lastMonth: [
                        { $match: { dateOrdered : { $gte: lastMonthDate } } },
                        { $group: { _id: null, total: { $sum: "$totalPrice" } } }
                    ],
                    lastYear: [
                        { $match: { dateOrdered : { $gte: lastYearDate } } },
                        { $group: { _id: null, total: { $sum: "$totalPrice" } } }
                    ]
                }
            }
        ]);

        // top10 products
        const topProducts = await orderDB.aggregate([
            {$unwind : '$productItems'},
            {$group : {
                 _id : '$productItems.productId',
                totalSold : {$sum : '$productItems.quantity'},
                totalRevenues : {$sum : {$multiply : ['$productItems.price' , '$productItems.quantity']}}
                }
            },
            {$sort : {
                totalSold : -1
                }
            },
            {$limit : 10},
            {$lookup : {
                from : 'products',
                localField : '_id',
                foreignField : '_id',
                as : 'productDetails'
            }},
            {$unwind : '$productDetails'},
            {$project : {
                name : '$productDetails.name',
                image : '$productDetails.image',
                offerPrice : '$productDetails.discountedPrice',
                priceMRP : '$productDetails.price',
                totalQuantity : '$productDetails.stockQuantity',
                totalSold : 1,
                totalRevenues : 1
            }}
        ])

        // top 10 categoies
        const topCategories = await orderDB.aggregate([
            {$unwind : '$productItems'},
            {$lookup : {
                from : 'products',
                localField : 'productItems.productId',
                foreignField : '_id',
                as : 'productDetails'
            }},
            {$unwind : '$productDetails'},
            {$lookup : {
                from : 'category',
                localField : 'productDetails.category',
                foreignField : '_id',
                as : 'categoryDetails'
            }},
            {$unwind : '$categoryDetails'},
            {$group : {
                _id : '$categoryDetails._id',
                name : {$first : '$categoryDetails.name'},
                totalSold : {$sum : '$productItems.quantity'},
                totalRevenues : {$sum : {$multiply : ['$productItems.price' , '$productItems.quantity']}}
            }},
            {$sort : { totalSold : -1 } },
            {$limit : 10}
        ])

        // top 10 brands
        const topBrands = await orderDB.aggregate([
            {$unwind : '$productItems'},
            {$lookup : {
                from : 'products',
                localField : 'productItems.productId',
                foreignField : '_id',
                as : 'productDetails'
            }},
            {$unwind : '$productDetails'},
            {$lookup : {
                from : 'brands',
                localField : 'productDetails.brand',
                foreignField : '_id',
                as : 'brandDetails'
            }},
            {$unwind : '$brandDetails'},
            {$group : {
                _id : '$brandDetails._id',
                name : {$first : '$brandDetails.name'},
                totalSold : {$sum : '$productItems.quantity'},
                totalRevenues : {$sum : {$multiply : ['$productItems.price' , '$productItems.quantity']}}
            }},
            {$sort : { totalSold : -1 } },
            {$limit : 10}
        ])

        const salesCount = await orderDB.aggregate([
            {
                $match :{
                    status : "Delivered",
                }
            },
            {
                $group : { _id : null , totalSaleCount : {$sum : 1}}
            }
        ]) 
        const customers = await user.find().countDocuments();

        // const revenue = await orderDB.aggregate([
        //     { $match : {paymentStatus : "Paid"}},
        //     { $group : {_id : null , amounts : {$sum : "$totalAmount"}}}
        // ])
        const revenue = await orderDB.aggregate([
            { $match : {status : "Delivered"}},
            { $group : {_id : null , amounts : {$sum : "$totalPrice"}}}
        ]);

        const lastWeekSales = (salesData[0].lastWeek[0] && salesData[0].lastWeek[0].total) ? salesData[0].lastWeek[0].total : 0;
        const previousWeekSales = (salesData[0].previousWeek[0] && salesData[0].previousWeek[0].total) ? salesData[0].previousWeek[0].total : 0;
        const lastMonthSales = (salesData[0].lastMonth[0] && salesData[0].lastMonth[0].total) ? salesData[0].lastMonth[0].total : 0;
        const lastYearSales = (salesData[0].lastYear[0] && salesData[0].lastYear[0].total) ? salesData[0].lastYear[0].total : 0;
            
                    
        const totalSales = salesCount[0] ? salesCount[0].totalSaleCount : 0;
        const totalRevenue = revenue[0] ? revenue[0].amounts : 0;

        const calculatePercentageChange = (current,previous) => {
            if(previous === 0) return 100;
            return ((current,previous) / previous * 100).toFixed(2);
        }

        const revenueChange = calculatePercentageChange(lastWeekSales , previousWeekSales);
        const customersChange = 14;
        const salesChange = calculatePercentageChange(totalSales , 12);

        const recentSales = await orderDB.find()
        .sort({createdAt : -1})
        .limit(10)
        .populate('productItems.productId')

        const salesGraphData = await orderDB.aggregate([
            {
                $match: {
                    status: "Delivered",
                    createdAt: { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            },
            {
                $limit: 30 // Last 30 days
            }
        ]);

        const salesDates = salesGraphData.map(item => item._id);
        const salesCounts = salesGraphData.map(item => item.count);



        res.render('admin/dashboard',{
            admin : req.session.admin,
            lastWeekSales,
            lastMonthSales,
            lastYearSales,
            totalSales,
            customers,
            totalRevenue,
            revenueChange,
            customersChange,
            salesChange,
            topProducts,
            topCategories,
            topBrands,
            recentSales,
            salesDates: JSON.stringify(salesDates),
            salesCounts: JSON.stringify(salesCounts),
            err,success
        });
        }catch(err){
            console.log("error in admin dashboard");
            res.render('500')
        }
    },
    salesReport : async(req,res)=>{
        try{
            console.log(req.body,"jlkjlk");
                const {startdate,enddate,downloadformat,timeInterval} = req.body;

                let startDate ,endDate;

                if (startdate && enddate) {
                    startDate = new Date(startdate);
                    endDate = new Date(enddate);
                    endDate.setHours(23, 59, 59, 999);

                var orders = await orderDB.find(
                     {status : "Delivered" , dateOrdered : {$gte : startDate , $lte : endDate}}
                 ).populate('productItems.productId')
        
                } else if (timeInterval) {
                    const now = moment();
                    switch (timeInterval) {
                        case 'day':
                            startDate = now.startOf('day').toDate();
                            endDate = now.endOf('day').toDate();
                            break;
                        case 'week':
                            startDate = now.startOf('isoweek').toDate();
                            endDate = now.endOf('isoweek').toDate();
                            break;
                        case 'month':
                            startDate = now.startOf('month').toDate();
                            endDate = now.endOf('month').toDate();
                            break;
                        case 'year':
                            startDate = now.startOf('year').toDate();
                            endDate = now.endOf('year').toDate();
                            break;
                        default:
                            return res.status(400).json({ message: "Invalid time interval" });
                    }
                        
                    var orders = await orderDB.find({status: "Delivered",
                        dateOrdered: { 
                            $gte: startDate,
                            $lte: endDate
                        }}).populate('productItems.productId');

                        console.log(orders,"orderss are there");
                        
                }

                if(orders.length == 0){
                    req.session.err = "There is no order in this date";
                    return res.redirect('/admin/')
                }

                // Calculate summary data
                let totalSales = 0;
                let totalDiscount = 0;
                let totalCouponDiscount = 0;
                let uniqueUsers = new Set();
                let paymentMethods = {};

                orders.forEach(order => {
                    totalSales += order.totalAmount || 0;
                    totalDiscount += order.discount || 0;
                    totalCouponDiscount += order.couponDiscount || 0;
                    uniqueUsers.add(order.userName);
                    paymentMethods[order.paymentMethod] = (paymentMethods[order.paymentMethod] || 0) + 1;
                });

                if(downloadformat === "pdf"){
                    const pdfBuffer = await generateSalesPDF(orders, startDate, endDate, {
                        totalSales,
                        totalDiscount,
                        totalCouponDiscount,
                        uniqueUsers: uniqueUsers.size,
                        paymentMethods
                    });

                    // res headers
                    res.setHeader('Content-type' , 'application/json')
                    res.setHeader(
                        "Content-Disposition",
                        "attachment; filename=sales Report.pdf"
                    )

                    res.status(200).end(pdfBuffer)

                }else if(downloadformat === 'excel'){
                    let totalSales = 0;

                    orders.forEach(order => {
                        totalSales += order.totalAmount || 0
                    });

                    excel.downloadReport(
                        req,
                        res,
                        orders,
                        startDate,
                        endDate,
                        totalSales.toFixed(2),
                        downloadformat
                    )
                }
        }catch(err){
            console.log("error at salereport",err);
            res.render('500');
        }
    },
    logout: (req,res)=>{
        // req.session.destroy((err)=>{
        //     if(err){
        //         console.log("logout Error :",err);
        //         res.redirect('/admin/dashboard')
        //     }else{
        //         res.clearCookie('admin-session');
        //         res.redirect('/admin/login')
        //     }
        // })
        if(req.session.admin){
            req.session.admin = false
            res.redirect('/admin/login')
        }else{
            res.redirect('/admin/login')
        }
    }
}