// src/routes/auth.js
import express from 'express';
import passport from 'passport';

const router = express.Router();

// Routes
router.get('/', (req, res) => res.json({user:req.user}));

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    successRedirect: process.env.FRONTEND_URL + '/dashboard'
  })
);

router.get('/logout', (req, res) => {
  // Clear the session cookie on logout
  res.clearCookie('connect.sid',"", {
    secure: false,
    httpOnly: false,
    sameSite: 'none'
  });
  res.redirect(process.env.FRONTEND_URL + '/');
});

export default router;
