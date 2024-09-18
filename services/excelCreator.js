const fs = require('fs');
const ejs = require('ejs');
const exceljs = require('exceljs');
const { format } = require("date-fns");


module.exports = {

    downloadReport : async (req,res,orders,startDate,endDate,totalSales,downloadformat) => {
        
        const formattedStartDate = format(new Date(startDate), 'yyyy-mm-dd');
        const formattedEndDate = format(new Date(endDate), 'yyyy-mm-dd');

        try{

            const totalAmount = parseInt(totalSales)
            console.log(totalAmount,"total saaales");
            console.log(orders,downloadformat,"total saaales");

            const template = fs.readFileSync('services/tempExcel.ejs','utf-8');
            const html = ejs.render(template , {orders, startDate, endDate, totalAmount});

            if(downloadformat === 'excel'){
                const workbook = new exceljs.Workbook();
                const worksheet = workbook.addWorksheet('Sales Report');

                worksheet.columns = [
                    {header :  'Order ID' , key : 'orderId' , width : 25},
                    { header: 'Product Name', key: 'productName', width: 25 },
                    { header: 'User ID', key: 'userId', width: 25},
                    { header: 'Date', key: 'date', width: 25 },
                    { header: 'Total Amount', key: 'totalamount', width: 25 },
                    { header: 'Payment Method', key: 'paymentmethod', width: 25 },
                ];

                let totalSalesAmount = 0;

                orders.forEach(order => {
                    order.productItems.forEach( item => {
                    worksheet.addRow({
                        orderId : order._id.toString().slice(0, 7),
                        productName : item?.productId?.name,
                        userId : order.userId,
                        date : order.dateOrdered ? new Date(order.dateOrdered).toLocaleDateString() : '',
                        totalamount: order.totalPrice !== undefined ? order.totalPrice.toFixed(2) : '',
                        paymentmethod: order.paymentMethod
                    })
                        totalSalesAmount += order.totalPrice !== undefined ? order.totalPrice : 0;
                    });
                });

                worksheet.addRow({ totalamount : 'Total Sales Amount', paymentmethod : totalSalesAmount.toFixed(2)});

                const excelFilePath = `public/excelSR/sales-report-${formattedStartDate}-${formattedEndDate}.xlsx`;
                await workbook.xlsx.writeFile(excelFilePath);

                res.status(200).download(excelFilePath)
            }else{
                res.status(404).send('Invalid download format');
            }
        }catch(error){
            console.error(('Error generatingt the sales report',error));
            res.status(500).json('Internal Server Error');
        }
    }
}