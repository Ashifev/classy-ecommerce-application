const easyinvoice = require('easyinvoice');
const fs = require('fs');
const path = require('path');


module.exports = {
    generateInvoice : async (orderDetails) => {

        try{
            const formDate = (date) => {
                return date ? new Date(date).toLocaleDateString('en-US') : '';
            };

            const data = {
                "cusomize" : {

                },
                "images" : {
                    "logo" : fs.readFileSync(path.join(__dirname,'..','public','images','logo3.png'),'base64'),
                },
                "sender" : {
                    "company" : "CLASSY",
                    "address" : "71717 132, My Street, kozhikode, Kerala 12401",
                    "zip" : "607645",
                    "city" : "Kozhikode",
                    "country" : "India"
                },
                "client" : {
                    "company" : orderDetails.billingAddress[0].locality,
                    "address" : orderDetails.billingAddress[0].address,
                    "zip" : orderDetails.billingAddress[0].pincode,
                    "city" : orderDetails.billingAddress[0].city,
                    "country" : "India"
                },
                "information" : {
                    "order id" : orderDetails._id,
                    "date" : formDate(orderDetails.dateOrdered),
                    "invoice date" : formDate(orderDetails.dateOrdered)
                },
                "products" : orderDetails.productItems.map(product => ({
                    "quantity" : product.quantity.toString(),
                    "description" : product.productId.name,
                    "tax-rate" : 1,
                    "price" : product.productId.discountedPrice
                })),
                "bottom-notice" : "Thank you for choosing the CLASSY",
                "settings" : {
                    "currency" : "INR" ,
                    "tax-notation" : "GST",
                    "margin-top" : 25,
                    "margin-right": 25,
                    "margin-left" : 25,
                    "margin-bottom": 25
                }
            }

            console.log('heere',data)
            const result = await easyinvoice.createInvoice(data);

            if(result.pdf){
                console.log("result.pdf");
                const pdfPath = path.join(__dirname,'..','public','infoPdf',`${orderDetails._id}.pdf`);
                await fs.promises.writeFile(pdfPath,result.pdf,'base64');
                console.log("saved the pdf successfully",pdfPath);
                return pdfPath;
            }else{
                console.error('Error generating PDF ' , result);
                return null;
            }

        }catch(error){
            console.error('Error in generateInvoice',error);
            return null;
        }
    }
}