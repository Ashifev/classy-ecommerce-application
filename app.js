const createError = require('http-errors');
const express = require('express');
const path = require('path');
// const mongoose = require('mongoose')
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const nocache = require('nocache')
const session = require('express-session');
const bodyParser=require('body-parser')
const methodOverride = require('method-override');


const app = express();

//passport for google auth
const passport = require('passport');
require('./config/passport')
const dbConnection = require('./config/dbConnection')

//route
const userRouter = require('./routes/userRouter');
const adminRouter = require('./routes/adminRouter');
const authRouter = require('./routes/googleAuth')


app.use(bodyParser.json());
app.use(methodOverride('_method'));

// //admin session
// app.use('/admin', session({
//   name: 'admin-session',
//   secret: 'admin-secret',
//   resave: false,
//   saveUninitialized: true,
 
// }));
// //user session
// app.use('/user', session({
//   name: 'user-session',
//   secret: 'user-secret',
//   resave: false,
//   saveUninitialized: true,
// }));


session
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

//initialize passport
app.use(passport.initialize());
app.use(passport.session());

app.use(nocache())

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use((error, req, res, next) => {

//   const errorStatus = (error.status) ? error.status : 500; 
//   const errorMessage = (error.message) ? error.message : "Something went wrong";

//   if(errorStatus == 500){

//   }
//   return res.status(errorStatus).json({
//     success: false,
//     status: errorStatus,
//     message: errorMessage,
//     stack: error.stack,
//   });

// });



app.use('/', userRouter);
app.use('/admin', adminRouter);
app.use('/auth',authRouter);
// catch 404 and forward to error handler

app.get("*", (req, res) => {
  res.render("404");
});

app.use(function(req, res, next) {
  next(createError(404));
});


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
