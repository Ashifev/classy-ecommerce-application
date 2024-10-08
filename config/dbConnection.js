const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
.then(()=>{
    console.log("Database Connected");
})
.catch((err)=>{
    console.log("Failed to connect with Database",err);
})