const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

require('./auth/google'); // passport strategy

const app = express();
const PORT = 3000;

// MongoDB connect
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("Connected to MongoDB");
});

// Middleware
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(session({
  secret: 'your_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // true in production
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get('/', (req, res) => res.send('Auth Server Running'));

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    successRedirect: 'http://localhost:5173/dashboard'
  })
);

app.get('/api/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: 'Not Authenticated' });
  }
});

app.get('/logout', (req, res) => {
  req.logout(() => {
    res.clearCookie('connect.sid');
    res.redirect('http://localhost:5173');
  });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
