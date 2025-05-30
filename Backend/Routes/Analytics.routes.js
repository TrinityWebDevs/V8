import express from 'express';
import ShortLink from '../model/shortLink.model.js';
import ClickLog from '../model/clickLog.model.js';

const router = express.Router();

// Get total analytics for all links in a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    // Fetch all links in the project
    const links = await ShortLink.find({ project: projectId })
      .select('_id shortCode originalUrl clickCount createdAt')
      .sort({ clickCount: -1 }); // Sort by most clicks first

    const linkIds = links.map(link => link._id);

    // Aggregate total clicks
    const totalClicks = await ClickLog.countDocuments({ shortLink: { $in: linkIds } });

    // Aggregate top browsers
    const browsersAgg = await ClickLog.aggregate([
      { $match: { shortLink: { $in: linkIds } } },
      { $group: { _id: "$browser", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Aggregate top countries
    const countriesAgg = await ClickLog.aggregate([
      { $match: { shortLink: { $in: linkIds }, "geo.country": { $exists: true, $ne: "" } } },
      { $group: { _id: "$geo.country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Clicks in last 7 days grouped by day
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6); // Include today

    const clicksLast7Days = await ClickLog.aggregate([
      { $match: { shortLink: { $in: linkIds }, timestamp: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing days with 0 clicks
    const dateMap = new Map();
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, 0);
    }

    clicksLast7Days.forEach(day => {
      dateMap.set(day._id, day.count);
    });

    const clicksTrend = Array.from(dateMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    return res.json({
      totalLinks: links.length,
      totalClicks,
      links,
      topBrowsers: browsersAgg,
      topCountries: countriesAgg,
      clicksTrend
    });
  } catch (err) {
    console.error('Analytics fetch error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get individual link analytics
router.get('/project/:projectId/:shortCode', async (req, res) => {
    try {
      const { projectId, shortCode } = req.params;
  
      // Find the short link by project and shortCode
      const link = await ShortLink.findOne({ project: projectId, shortCode });
      if (!link) {
        return res.status(404).json({ message: 'Link not found' });
      }
  
      // Get total clicks for this link from ClickLog (should match link.clickCount)
      const totalClicks = await ClickLog.countDocuments({ shortLink: link._id });
  
      // Top browsers for this link
      const browsersAgg = await ClickLog.aggregate([
        { $match: { shortLink: link._id } },
        { $group: { _id: "$browser", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);
  
      // Top countries for this link
      const countriesAgg = await ClickLog.aggregate([
        { $match: { shortLink: link._id, "geo.country": { $exists: true, $ne: "" } } },
        { $group: { _id: "$geo.country", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);
  
      // Clicks trend for last 7 days
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
      const clicksLast7Days = await ClickLog.aggregate([
        { $match: { shortLink: link._id, timestamp: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: {
              year: { $year: "$timestamp" },
              month: { $month: "$timestamp" },
              day: { $dayOfMonth: "$timestamp" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
      ]);
  
      const clicksTrend = clicksLast7Days.map(item => {
        const { year, month, day } = item._id;
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return { date: dateStr, count: item.count };
      });
  
      return res.json({
        shortCode: link.shortCode,
        originalUrl: link.originalUrl,
        createdAt: link.createdAt,
        expiresAt: link.expiresAt,
        totalClicks,
        topBrowsers: browsersAgg,
        topCountries: countriesAgg,
        clicksTrend
      });
  
    } catch (err) {
      console.error('Individual analytics error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
});
  
export default router;
