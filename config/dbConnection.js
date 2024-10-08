const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI,{ useNewUrlParser: true, useUnifiedTopology: true })
.then(()=>{
    console.log("Database Connected");
})
.catch((err)=>{
    console.log("Failed to connect with Database",err);
})