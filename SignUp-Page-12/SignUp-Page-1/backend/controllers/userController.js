const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const User = require("../models/userModel");
const sendToken = require("../utils/jwtToken");
const PDFDocument = require('pdfkit');

// Register a User
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
    const {name, email, password} = req.body;

    const users = await User.findOne({ email }).select("+password");

    if(users){
        return next(new ErrorHandler("User is already exist please login", 401));
    }

    const user = await User.create({
        name, email, password,
    });

    sendToken(user, 201, res);
});

// Login User
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
    const {email, password} = req.body;

    // Checking if user has given password and email both
    if(!email || !password){
        return next(new ErrorHandler("Please Enter Email & Password", 400));
    }

    const user = await User.findOne({ email }).select("+password");

    if(!user){
        return next(new ErrorHandler("Invalid Email or Password", 401));
    }

    const isPasswordMatched = await user.comparePassword(password);

    if(!isPasswordMatched){
        return next(new ErrorHandler("Invalid Email or Password", 401));
    }

    sendToken(user, 200, res);
});


// Logout User
exports.logout = catchAsyncErrors(async (req, res, next) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    });

    res.status(200).json({
        success: true,
        message: "Logged Out",
    });
});


// Creating PDF
exports.createPdf = catchAsyncErrors(async (req, res, next) => {
    try {
      const { messages } = req.body;
    //   console.log(messages);
  
      // Create a PDF document
      const doc = new PDFDocument();
      const fileName = 'output.pdf';
  
      // Set content disposition to force the browser to download the file
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', 'application/pdf');
  
      // Pipe the PDF content to the response
      doc.pipe(res);
  
      // Write questionnaire or chat messages to the PDF
      doc.fontSize(12);
      [...messages].forEach((message, index) => {
        const messageText = message.desc ? message.desc : 'N/A';
        doc.text(`${index + 1}. ${messageText}`); 
        doc.moveDown();
      });
  
      // Finalize the PDF
      doc.end();
    } catch (error) {
      // Handle errors
      console.error(error);
      return next(error);
    }
  });
