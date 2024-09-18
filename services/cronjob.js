const cron = require('node-cron');
const Offer = require('../models/offerModel');
const Product = require('../models/productModel');

// Schedule the job to run every day at midnight
cron.schedule('* * * * *', async () => {
  console.log('Running offer expiry check...');
  
  try {
        const expiredOffers = await Offer.find({
            expireDate : { $lte : new Date()},
            status : 'Active'
        })

        for(const offer of expiredOffers){
            offer.status = 'Inactive';
            await offer.save()

            const products = await Product.find({ category : offer.categoryId , inCategoryOffer : true});

            for(const product of products){
                await product.updateCategoryOffer(null);
            }

            console.log(`Deactivated offer${offer.categoryId} && updated products.`);

        }

  } catch (error) {
    console.error('Error in offer expiry job:', error);
  }
});

console.log('Offer expiry job scheduled.');