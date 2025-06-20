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
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
    const referrer = req.get('Referrer') || null;
    const userAgent = req.get('User-Agent') || null;

    // Parse user agent
    const parser = new UAParser.UAParser();
    parser.setUA(userAgent);
    const browser = parser.getBrowser().name || 'Unknown';
    const os = parser.getOS().name || 'Unknown';
    const deviceType = parser.getDevice().type || 'Desktop';

    // Default geo data
    let geo = {
      country: '',
      region: '',
      city: ''
    };

    // Check for private/local IPs
    const privateIPRegex = /^(::1|::ffff:127\.|fe80::|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/i;
    const isPrivateIP = privateIPRegex.test(ip);

    // Handle localhost separately
    if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127.')) {
      geo = { 
        country: 'Localhost', 
        region: 'Development', 
        city: 'Local' 
      };
    }
    // Make API call for public IPs with valid key
    else if (IPAPI_KEY && !isPrivateIP) {
      try {
        const geoRes = await axios.get(
          `https://api.ipapi.com/${ip}?access_key=${IPAPI_KEY}`,
          { timeout: 5000 }  // 5-second timeout
        );
        
        geo = {
          country: geoRes.data.country_name || '',
          region: geoRes.data.region_name || '',
          city: geoRes.data.city || ''
        };
      } catch (err) {
        console.warn('Geo lookup failed:', 
          err.response?.data?.error?.info || err.message
        );
      }
    }

    // Create click log
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
