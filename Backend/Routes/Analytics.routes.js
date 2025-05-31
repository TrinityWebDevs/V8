// routes/analytics.routes.js
import express from 'express';
import mongoose from 'mongoose';
import ShortLink from '../model/shortLink.model.js';
import ClickLog from '../model/clickLog.model.js';

const router = express.Router();

/**
 * GET /project/:projectId/analytics
 *
 * Query parameters:
 *   - shortCode (optional): if present, return analytics for that single link.
 *                           If absent, return project-wide analytics.
 */
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { shortCode } = req.query;

    // Validate projectId
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID' });
    }

    // If a shortCode was provided, return “individual link” analytics
    if (shortCode) {
      // 1) Find that single ShortLink under this project
      const link = await ShortLink.findOne({ project: projectId, shortCode });
      if (!link) {
        return res
          .status(404)
          .json({ message: 'Link not found in this project' });
      }

      // 2) Total clicks for this link (from ClickLog)
      const totalClicks = await ClickLog.countDocuments({
        shortLink: link._id,
      });

      // 3) Top 5 browsers for this link
      const topBrowsers = await ClickLog.aggregate([
        { $match: { shortLink: link._id } },
        { $group: { _id: '$browser', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);

      // 4) Top 5 countries for this link
      const topCountries = await ClickLog.aggregate([
        {
          $match: {
            shortLink: link._id,
            'geo.country': { $exists: true, $ne: '' },
          },
        },
        { $group: { _id: '$geo.country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);

      // 5) Clicks‐over‐time for last 7 days (grouped by YYYY-MM-DD)
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const clicksLast7 = await ClickLog.aggregate([
        {
          $match: {
            shortLink: link._id,
            timestamp: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id': 1 } },
      ]);

      // Fill in missing days with 0
      const dateMap = new Map();
      for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        dateMap.set(dateStr, 0);
      }
      clicksLast7.forEach(item => {
        dateMap.set(item._id, item.count);
      });
      const clicksTrend = Array.from(dateMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, count]) => ({ date, count }));

      return res.json({
        singleLink: true,
        shortCode: link.shortCode,
        originalUrl: link.originalUrl,
        createdAt: link.createdAt,
        expiresAt: link.expiresAt,
        totalClicks,
        topBrowsers,
        topCountries,
        clicksTrend,
      });
    }

    // Otherwise: return “project-wide” analytics
    // 1) Fetch all links in this project
    const links = await ShortLink.find({ project: projectId })
      .select('_id shortCode originalUrl clickCount createdAt expiresAt')
      .sort({ clickCount: -1 });

    const linkIds = links.map(l => l._id);

    // 2) Total clicks across all links
    const totalClicks = await ClickLog.countDocuments({
      shortLink: { $in: linkIds },
    });

    // 3) Top 5 browsers across all links
    const topBrowsers = await ClickLog.aggregate([
      { $match: { shortLink: { $in: linkIds } } },
      { $group: { _id: '$browser', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // 4) Top 5 countries across all links
    const topCountries = await ClickLog.aggregate([
      {
        $match: {
          shortLink: { $in: linkIds },
          'geo.country': { $exists: true, $ne: '' },
        },
      },
      { $group: { _id: '$geo.country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // 5) Clicks‐over‐time (last 7 days) across all links
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const clicksLast7 = await ClickLog.aggregate([
      {
        $match: {
          shortLink: { $in: linkIds },
          timestamp: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id': 1 } },
    ]);

    // Fill in missing days with 0
    const dateMap = new Map();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      dateMap.set(dateStr, 0);
    }
    clicksLast7.forEach(item => {
      dateMap.set(item._id, item.count);
    });
    const clicksTrend = Array.from(dateMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    return res.json({
      singleLink: false,
      totalLinks: links.length,
      totalClicks,
      links,       // array of { _id, shortCode, originalUrl, clickCount, createdAt, expiresAt }
      topBrowsers,
      topCountries,
      clicksTrend,
    });
  } catch (err) {
    console.error('Analytics fetch error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
