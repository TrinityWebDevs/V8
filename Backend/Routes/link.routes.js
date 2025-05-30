import express from 'express';
import mongoose from 'mongoose';
import ShortLink from '../model/shortLink.model.js';
import Project from '../model/project.model.js';

const router = express.Router();

// Create short link
router.post('/create', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not Authenticated' });
    }

    const userId = req.user._id;
    const { projectId, originalUrl, customCode, domain, comments, password, expiresAt } = req.body;

    if (!projectId || !originalUrl || !domain) {
      return res.status(400).json({ message: 'Project ID, original URL and domain are required' });
    }
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.members.some(m => m.equals(userId))) {
      return res.status(403).json({ message: 'Not authorized to add links to this project' });
    }

    // Generate or validate shortCode
    let shortCode = customCode?.trim() || null;
    if (!shortCode) {
      const gen = () => Math.random().toString(36).substring(2, 8);
      let unique = false;
      while (!unique) {
        const code = gen();
        if (!(await ShortLink.findOne({ shortCode: code }))) {
          shortCode = code;
          unique = true;
        }
      }
    } else {
      if (await ShortLink.findOne({ shortCode })) {
        return res.status(409).json({ message: 'Custom code already in use' });
      }
    }

    // Validate expiresAt
    let expiryDate = null;
    if (expiresAt) {
      const dt = new Date(expiresAt);
      if (isNaN(dt.getTime())) {
        return res.status(400).json({ message: 'Invalid expiry date' });
      }
      expiryDate = dt;
    }

    const newLink = new ShortLink({
      project: projectId,
      originalUrl,
      shortCode,
      domain,
      comments: comments?.trim() || null,
      password: password?.trim() || null,
      expiresAt: expiryDate
    });
    await newLink.save();

    res.status(201).json({ message: 'Short link created', shortLink: newLink });
  } catch (err) {
    console.error('Error creating short link:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete short link
router.delete('/delete/:shortLinkId', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not Authenticated' });
    }

    const userId = req.user._id;
    const { shortLinkId } = req.params;
    if (!shortLinkId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid short link ID' });
    }

    const link = await ShortLink.findById(shortLinkId);
    if (!link) return res.status(404).json({ message: 'Short link not found' });

    const project = await Project.findById(link.project);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.members.some(m => m.equals(userId))) {
      return res.status(403).json({ message: 'Not authorized to delete this link' });
    }

    await link.deleteOne();
    res.status(200).json({ message: 'Short link deleted' });
  } catch (err) {
    console.error('Error deleting short link:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Info about a short link
router.get('/info/:shortCode', async (req, res) => {
    const { shortCode } = req.params;
  
    try {
      const link = await ShortLink.findOne({ shortCode });
  
      if (!link) {
        return res.status(404).json({ message: 'Short link not found' });
      }
  
      const now = new Date();
      const expired = link.expiresAt && now > link.expiresAt;
      const requiresPassword = !!link.password;
  
      return res.json({
        originalUrl: link.originalUrl, // optional, for future use
        requiresPassword,
        expired,
        comments: link.comments || null, // optional
      });
    } catch (err) {
      console.error('Error fetching link info:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  });

// Verify password for password-protected links
router.post('/verify-password/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    const { password } = req.body;
    const link = await ShortLink.findOne({ shortCode });
    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }

    if (link.expiresAt && new Date() > new Date(link.expiresAt)) {
      return res.status(410).json({ message: 'Link has expired' });
    }
    if (!link.password) {
      return res.status(400).json({ message: 'This link is not password protected' });
    }
    if (link.password !== password) {
      return res.status(403).json({ message: 'Incorrect password' });
    }

    // Successful validation → increment and respond with redirect URL
    link.clickCount += 1;
    await link.save();
    res.json({ redirectTo: link.originalUrl });
  } catch (err) {
    console.error('Password verification error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
