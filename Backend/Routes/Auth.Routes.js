// src/routes/auth.js
import express from 'express';
import passport from 'passport';

const router = express.Router();

// Routes
router.get('/', (req, res) => res.send('Auth Server Running'));

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    successRedirect: 'http://localhost:5173/dashboard'
  })
);

router.get('/logout', (req, res) => {
  // Clear the session cookie on logout
  res.clearCookie('connect.sid',"", {
    secure: false,
    httpOnly: false,
    sameSite: 'none'
  });
  res.redirect('http://localhost:5173/');
});

export default router;
