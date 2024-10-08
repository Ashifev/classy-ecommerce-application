const walletDB = require('../models/walletModel');

module.exports = {
    getWallet : async(req,res)=>{
        try{
            const user = req.session.user;
            const wallet = await walletDB.findOne(
                { user: user },
                {
                  user: 1,
                  balance: 1,
                  transactions: {
                    $sortArray: { 
                      input: "$transactions", 
                      sortBy: { createdAt: -1 } 
                    }
                  }
                }
              );
            if(!wallet){
                return res.render('user/wallet',{wallet : null,user:user?.name,summary : null,profile:user})
            }
            const currentDate = new Date();
            const firstDayOfMonth = new Date(currentDate.getFullYear(),currentDate.getMonth(), 1);
            const lastDayOfLastMonth = new Date(firstDayOfMonth)
            lastDayOfLastMonth.setDate(firstDayOfMonth.getDate() - 1);
            const firstDayOflastMonth = new Date(lastDayOfLastMonth.getFullYear(), lastDayOfLastMonth.getMonth(), 1);

            const summary = {
                thisMonth: {
                    totalIn: 0,
                    totalOut: 0
                },
                lastMonth: {
                    totalIn: 0,
                    totalOut: 0
                },
                totalIn: 0,
                totalOut: 0
            };

            wallet.transactions.forEach(transaction=>{
                const amount = transaction.amount;
                if(transaction.type === "credit"){
                    summary.totalIn += amount ;
                    if(transaction.createdAt >= firstDayOfMonth){
                        summary.thisMonth.totalIn += amount;
                    }else if(transaction.createdAt >= firstDayOflastMonth && transaction.createdAt < firstDayOfMonth ){
                        summary.lastMonth.totalIn += amount;
                    }
                }else{
                    summary.totalOut += amount;
                    if(transaction.createdAt >= firstDayOfMonth){
                        summary.thisMonth.totalOut += amount;
                    }else if(transaction.createdAt >= firstDayOflastMonth && transaction.createdAt < firstDayOfMonth ){
                        summary.lastMonth.totalOut += amount;
                    }
                }
            })
            res.render('user/wallet',{wallet, user : user.name, summary, profile:user});

        }catch(err){
            console.log("error at getting wallet",err);
            res.render('500');
        }
    }
}