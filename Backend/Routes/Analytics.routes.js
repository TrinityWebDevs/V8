import express from 'express';
import mongoose from 'mongoose';
import ShortLink from '../model/shortLink.model.js';
import ClickLog from '../model/clickLog.model.js';

const router = express.Router();

// Helper to calculate date range
const getDateRange = (timeRange) => {
  const now = new Date();
  let startDate = new Date(now);
  
  switch (timeRange) {
    case '24h':
      startDate.setDate(now.getDate() - 1);
      break;
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
    case '1y':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate = new Date(0); // All time
  }
  
  return startDate;
};

// Helper to get date format for grouping
const getDateFormat = (timeRange) => {
  switch (timeRange) {
    case '24h':
      return '%Y-%m-%d %H:00';
    case '7d':
    case '30d':
      return '%Y-%m-%d';
    case '1y':
      return '%Y-%m';
    default:
      return '%Y-%m-%d';
  }
};

router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { shortCode, timeRange = '7d' } = req.query;
    const startDate = getDateRange(timeRange);
    const dateFormat = getDateFormat(timeRange);

    // Validate projectId
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID' });
    }

    // Common match filter
    const baseMatch = { timestamp: { $gte: startDate } };

    // If a shortCode was provided
    if (shortCode) {
      const link = await ShortLink.findOne({ project: projectId, shortCode });
      if (!link) {
        return res.status(404).json({ message: 'Link not found in this project' });
      }

      // Add to base match
      baseMatch.shortLink = link._id;

      // 1) Total clicks for this link
      const totalClicks = await ClickLog.countDocuments(baseMatch);

      // 2) Top browsers
      const topBrowsers = await ClickLog.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$browser', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);

      // 3) Top OS
      const topOS = await ClickLog.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$os', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);

      // 4) Device types (mobile/desktop/tablet)
      const topDeviceTypes = await ClickLog.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$deviceType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      // 5) Top countries
      const topCountries = await ClickLog.aggregate([
        {
          $match: {
            ...baseMatch,
            'geo.country': { $exists: true, $ne: '' },
          },
        },
        { $group: { _id: '$geo.country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);

      // 6) Top cities
      const topCities = await ClickLog.aggregate([
        {
          $match: {
            ...baseMatch,
            'geo.city': { $exists: true, $ne: '' },
          },
        },
        { $group: { _id: '$geo.city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);

      // 7) Top continents
      const topContinents = await ClickLog.aggregate([
        {
          $match: {
            ...baseMatch,
            'geo.continent': { $exists: true, $ne: '' },
          },
        },
        { $group: { _id: '$geo.continent', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);

      // 8) Last click timestamp
      const lastClick = await ClickLog.findOne(baseMatch)
        .sort({ timestamp: -1 })
        .select('timestamp');

      // 9) Clicks-over-time
      const clicksTrend = await ClickLog.aggregate([
        {
          $match: baseMatch,
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: dateFormat,
                date: '$timestamp',
                timezone: 'UTC'
              }
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id': 1 } },
      ]);

      return res.json({
        singleLink: true,
        shortCode: link.shortCode,
        originalUrl: link.originalUrl,
        createdAt: link.createdAt,
        expiresAt: link.expiresAt,
        totalClicks,
        topBrowsers,
        topOS,
        topDeviceTypes,
        topCountries,
        topCities,
        topContinents,
        lastClick: lastClick?.timestamp,
        clicksTrend,
      });
    }

    // Project-wide analytics
    const links = await ShortLink.find({ project: projectId })
      .select('_id shortCode originalUrl clickCount createdAt expiresAt')
      .sort({ clickCount: -1 });

    const linkIds = links.map(l => l._id);

    // Update base match
    baseMatch.shortLink = { $in: linkIds };

    // 1) Total clicks across all links
    const totalClicks = await ClickLog.countDocuments(baseMatch);

    // 2) Top browsers
    const topBrowsers = await ClickLog.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$browser', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // 3) Top OS
    const topOS = await ClickLog.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$os', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // 4) Device types
    const topDeviceTypes = await ClickLog.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$deviceType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // 5) Top countries
    const topCountries = await ClickLog.aggregate([
      {
        $match: {
          ...baseMatch,
          'geo.country': { $exists: true, $ne: '' },
        },
      },
      { $group: { _id: '$geo.country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // 6) Top cities
    const topCities = await ClickLog.aggregate([
      {
        $match: {
          ...baseMatch,
          'geo.city': { $exists: true, $ne: '' },
        },
      },
      { $group: { _id: '$geo.city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // 7) Top continents
    const topContinents = await ClickLog.aggregate([
      {
        $match: {
          ...baseMatch,
          'geo.continent': { $exists: true, $ne: '' },
        },
      },
      { $group: { _id: '$geo.continent', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // 8) Top performing link
    const topLink = links.length > 0 
      ? { 
          shortCode: links[0].shortCode, 
          clickCount: links[0].clickCount 
        } 
      : null;

    // 9) Clicks-over-time
    const clicksTrend = await ClickLog.aggregate([
      {
        $match: baseMatch,
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: dateFormat,
              date: '$timestamp',
              timezone: 'UTC'
            }
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id': 1 } },
    ]);

    return res.json({
      singleLink: false,
      totalLinks: links.length,
      totalClicks,
      links,
      topBrowsers,
      topOS,
      topDeviceTypes,
      topCountries,
      topCities,
      topContinents,
      topLink,
      clicksTrend,
    });
  } catch (err) {
    console.error('Analytics fetch error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;