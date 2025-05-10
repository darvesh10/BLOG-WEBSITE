require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const ejs = require("ejs");
const expressLayouts = require("express-ejs-layouts");
const connectDB = require('./config/db')

const app = express();
//mongo db connet karna baad mein


connectDB();
app.use(express.static("public")); //for static files
app.use(expressLayouts);
app.set("view engine", "ejs");
app.set('layout', 'layouts/layout'); //our main layout file

app.use(express.urlencoded({extended: true})); //for form data

app.get("/", (req,res)=>{
    res.render("index",{title: "Home",
        user: null // we can pass user data here if we have any
    });
})

// Auth routes
app.get('/register', (req, res) => {
    res.render('register', { title: 'Register' });
  });
  
  app.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
  });
  
  // Protected dashboard route
  app.get('/dashboard', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.redirect('/login');
    }
    res.render('dashboard', { title: 'Dashboard', user: req.user });
  });
  
const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`);
})
