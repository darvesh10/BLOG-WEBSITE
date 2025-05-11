require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser');
const ejs = require("ejs");
const expressLayouts = require("express-ejs-layouts");
const connectDB = require('./config/db');
const jwt = require('jsonwebtoken');
const User = require('./models/user');
const bcrypt = require('bcryptjs');
const postRoutes = require('./routes/posts');
const methodOverride = require('method-override');
const { protect } = require('./middleware/auth');


const app = express();

// Connect to MongoDB
connectDB();

// Middleware

app.use(cookieParser());
app.use(express.static("public"));
app.use(expressLayouts);
app.set("view engine", "ejs");
app.set('layout', 'layouts/layout');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Set user in res.locals for EJS
app.use((req, res, next) => {
  res.locals.user = null;
  if (req.cookies.jwt && req.cookies.jwt !== 'loggedout') {
    try {
      const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);
      User.findById(decoded.id)
        .then(user => {
          res.locals.user = user;
          next();
        })
        .catch(err => next());
    } catch (err) {
      next();
    }
  } else {
    next();
  }
});

// Routes
app.get('/', (req, res) => {
  res.render('index', { 
    title: 'Home',
    user: res.locals.user || null
  });
});

app.get('/register', (req, res) => {
  res.render('register', { title: 'Register' });
});

app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).render('register', {
        title: 'Register',
        error: 'Username or email already exists',
        username,
        email
      });
    }

    const user = new User({ username, email, password });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    res.cookie('jwt', token, {
      maxAge: parseInt(process.env.JWT_COOKIE_EXPIRES) * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.redirect('/dashboard');
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).render('register', {
      title: 'Register',
      error: 'Error registering user - ' + err.message,
      username: req.body.username,
      email: req.body.email
    });
  }
});

app.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).render('login', {
        title: 'Login',
        error: 'Please provide username and password'
      });
    }

    const user = await User.findOne({ username }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).render('login', {
        title: 'Login',
        error: 'Incorrect username or password'
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    res.cookie('jwt', token, {
      expires: new Date(Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRES) * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax'
    });

    res.redirect('/dashboard');
  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).render('login', {
      title: 'Login',
      error: 'Internal server error, please try again.'
    });
  }
});

app.get('/logout', (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.redirect('/');
});

app.get('/dashboard', protect, (req, res) => {
  res.render('dashboard', { 
    title: 'Dashboard',
    user: req.user 
  });
});

app.use('/posts', postRoutes);

app.get('/posts/new', protect, (req, res) => {
  res.render('posts/new', { title: 'New Post' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
