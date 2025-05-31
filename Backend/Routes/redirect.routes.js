import express from 'express';
import axios from 'axios';
import ShortLink from '../model/shortLink.model.js';
import ClickLog from '../model/clickLog.model.js';
import * as UAParser from 'ua-parser-js';


const router = express.Router();
const IPAPI_KEY = process.env.IPAPI_KEY; 

// Redirect short link
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

    // Collect click data
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    const referrer = req.get('Referrer') || null;
    const userAgent = req.get('User-Agent') || null;

    // Use ua-parser-js
    const parser = new UAParser.UAParser();
    parser.setUA(userAgent);

    const browser = parser.getBrowser().name || 'Unknown';
    const os = parser.getOS().name || 'Unknown';
    const deviceType = parser.getDevice().type || 'Desktop';

    let geo = {};

    // Geolocation request using ipapi.com
    try {
        const geoRes = await axios.get(`http://api.ipapi.com/${ip}?access_key=${IPAPI_KEY}`);
        const geoData = geoRes.data;
        geo = {
          country: geoData.country_name || '',
          region: geoData.region_name || '',
          city: geoData.city || ''
        };
    } catch (err) {
        console.warn('Geo lookup failed:', err.message);
    }

    
  
    await ClickLog.create({
        shortLink: link._id,
        ip,
        timestamp: new Date(),
        referrer,
        userAgent,
        browser,
        os,
        deviceType,
        geo
    });
  

    return res.redirect(link.originalUrl);
  } catch (err) {
    console.error('Redirection error:', err);
    return res.status(500).send('Internal server error');
  }
});

export default router;