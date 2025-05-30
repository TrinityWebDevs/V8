import express from 'express';
import mongoose from 'mongoose';
import ShortLink from '../model/shortLink.model.js';


const router = express.Router();

// Redirect (single call for public links)
router.get('/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    const link = await ShortLink.findOne({ shortCode });
    if (!link) {
      return res.status(404).send('Link not found');
    }

    // Check expiry
    if (link.expiresAt && new Date() > new Date(link.expiresAt)) {
      return res.status(410).send('Link has expired');
    }

    // If password protected, inform client
    if (link.password) {
      return res.status(401).json({ message: 'Password required' });
    }

    // Public link → increment and redirect
    link.clickCount += 1;
    await link.save();
    return res.redirect(link.originalUrl);
  } catch (err) {
    console.error('Redirection error:', err);
    return res.status(500).send('Internal server error');
  }
});

export default router;