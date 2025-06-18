import express from 'express';
import mongoose from 'mongoose';
import Project from '../model/project.model.js';
import { Monitor, StatusCheck } from '../model/monitor.js';
import { monitorEvents } from '../utils/scheduler.js';
import { summarizeDowntime, analyzePerformanceAnomalies } from '../services/aiService.js';

const router = express.Router();

// Middleware to check authentication
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Not Authenticated' });
};

// Create a new monitor
router.post('/create', ensureAuthenticated, async (req, res) => {
  try {
    const { projectId, name, url, interval } = req.body;
    const userId = req.user._id;

    if (!projectId || !name || !url || !interval) {
      return res.status(400).json({ message: 'Project ID, name, URL, and interval (seconds) are required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID.' });
    }
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }
    if (!project.members.some(m => m.equals(userId))) {
      return res.status(403).json({ message: 'You are not authorized to add monitors to this project.' });
    }
    const intervalSeconds = Number(interval);
    if (isNaN(intervalSeconds) || intervalSeconds < 5) {
      return res.status(400).json({ message: 'Interval must be a number (at least 5 seconds).' });
    }
    const newMonitor = new Monitor({
      name,
      url,
      interval: intervalSeconds,
      project: projectId,
      owner: userId,
    });
    await newMonitor.save();

    // Notify the scheduler to start checking this new monitor immediately
    monitorEvents.emit('reschedule', newMonitor._id);

    res.status(201).json(newMonitor);
  } catch (error) {
    console.error('Error creating monitor:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Get recent status history for a monitor (for uptime blocks)
router.get('/:monitorId/history', ensureAuthenticated, async (req, res) => {
  try {
    const { monitorId } = req.params;
    const limit = parseInt(req.query.limit, 10) || 24;
    if (!mongoose.Types.ObjectId.isValid(monitorId)) {
      return res.status(400).json({ message: 'Invalid monitor ID.' });
    }
    const monitor = await Monitor.findById(monitorId);
    if (!monitor) {
      return res.status(404).json({ message: 'Monitor not found.' });
    }
    // Only allow project members to view
    const project = await Project.findById(monitor.project);
    const userId = req.user._id;
    if (!project || !project.members.some(m => m.equals(userId))) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    const history = await StatusCheck.find({ monitor: monitorId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .select('status timestamp aiAnalysis -_id');
    res.json({ history });
  } catch (error) {
    console.error('Error fetching status history:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Get all monitors for a project
router.get('/:projectId', ensureAuthenticated, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID.' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (!project.members.some(m => m.equals(userId))) {
      return res.status(403).json({ message: 'You are not authorized to view monitors for this project.' });
    }

    const monitors = await Monitor.find({ project: projectId });
    res.status(200).json(monitors);
  } catch (error) {
    console.error('Error fetching monitors:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Delete a monitor
router.delete('/:monitorId', ensureAuthenticated, async (req, res) => {
    try {
        const { monitorId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(monitorId)) {
            return res.status(400).json({ message: 'Invalid monitor ID.' });
        }

        const monitor = await Monitor.findById(monitorId).populate('project');

        if (!monitor) {
            return res.status(404).json({ message: 'Monitor not found.' });
        }

        if (!monitor.project.members.some(m => m.equals(userId))) {
            return res.status(403).json({ message: 'You are not authorized to delete this monitor.' });
        }

        // Also delete all associated status checks
        await StatusCheck.deleteMany({ monitor: monitorId });

        await monitor.deleteOne();

        // Notify scheduler to stop checking this monitor
        monitorEvents.emit('reschedule', monitorId);

        res.status(200).json({ message: 'Monitor deleted successfully.' });
    } catch (error) {
        console.error('Error deleting monitor:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});


// Toggle (pause/resume) a monitor
router.put('/toggle/:monitorId', ensureAuthenticated, async (req, res) => {
    try {
        const { monitorId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(monitorId)) {
            return res.status(400).json({ message: 'Invalid monitor ID.' });
        }

        const monitor = await Monitor.findById(monitorId).populate('project');

        if (!monitor) {
            return res.status(404).json({ message: 'Monitor not found.' });
        }

        if (!monitor.project.members.some(m => m.equals(userId))) {
            return res.status(403).json({ message: 'You are not authorized to modify this monitor.' });
        }

        monitor.isPaused = !monitor.isPaused;
        await monitor.save();

        // Notify scheduler to stop or start checking this monitor
        monitorEvents.emit('reschedule', monitorId);

        res.status(200).json(monitor);
    } catch (error) {
        console.error('Error toggling monitor:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});


// Get detailed stats for a monitor (for graphing)
router.get('/:monitorId/stats', ensureAuthenticated, async (req, res) => {
    const period = req.query.period || '24h'; // Default to 24h
    let startDate;
    const now = new Date();

    // Use a fresh Date object for each case to avoid mutation issues
    switch (period) {
        case '7d':
            startDate = new Date(new Date().setDate(now.getDate() - 7));
            break;
        case '30d':
            startDate = new Date(new Date().setMonth(now.getMonth() - 1));
            break;
        case '24h':
        default:
            startDate = new Date(new Date().setDate(now.getDate() - 1));
            break;
    }
    try {
        const { monitorId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(monitorId)) {
            return res.status(400).json({ message: 'Invalid monitor ID.' });
        }

        const monitor = await Monitor.findById(monitorId);
        if (!monitor) {
            return res.status(404).json({ message: 'Monitor not found.' });
        }

        const project = await Project.findById(monitor.project);
        if (!project || !project.members.some(m => m.equals(userId))) {
            return res.status(403).json({ message: 'Not authorized.' });
        }

        // Fetch status checks from the last 24 hours
        const stats = await StatusCheck.find({
            monitor: req.params.monitorId,
            timestamp: { $gte: startDate },
        }).sort({ timestamp: 'asc' }).select('status responseTime timestamp error');

        // --- Vitals Calculation ---
        const upCount = stats.filter(s => s.status === 'Up').length;
        const downEvents = stats.filter(s => s.status === 'Down');
        const totalCount = stats.length;
        const uptimePercentage = totalCount > 0 ? (upCount / totalCount) * 100 : 100;

        const responseTimes = stats.filter(s => s.responseTime !== null).map(s => s.responseTime);
        const avgResponseTime = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
        const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
        const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;

        // --- AI Analyses ---
        const aiSummary = await summarizeDowntime(downEvents);
        const performanceAnalysis = await analyzePerformanceAnomalies(stats);

        // --- Advanced Chart Data ---
        const histogramBuckets = {
            '<100ms': 0,
            '100-300ms': 0,
            '300-700ms': 0,
            '700-1500ms': 0,
            '>1500ms': 0,
        };
        responseTimes.forEach(rt => {
            if (rt < 100) histogramBuckets['<100ms']++;
            else if (rt < 300) histogramBuckets['100-300ms']++;
            else if (rt < 700) histogramBuckets['300-700ms']++;
            else if (rt < 1500) histogramBuckets['700-1500ms']++;
            else histogramBuckets['>1500ms']++;
        });

        const heatmapData = downEvents.reduce((acc, event) => {
            const date = new Date(event.timestamp).toISOString().split('T')[0];
            const existing = acc.find(d => d.date === date);
            if (existing) {
                existing.count++;
            } else {
                acc.push({ date, count: 1 });
            }
            return acc;
        }, []);

        const downtimeForensics = downEvents.reduce((acc, event) => {
            const errorKey = event.error ? event.error.split(':')[0].trim() : 'Unknown';
            acc[errorKey] = (acc[errorKey] || 0) + 1;
            return acc;
        }, {});

        res.json({
            stats,
            vitals: {
                uptimePercentage: uptimePercentage.toFixed(2),
                avgResponseTime: avgResponseTime.toFixed(0),
                minResponseTime: minResponseTime.toFixed(0),
                maxResponseTime: maxResponseTime.toFixed(0),
                downtimeCount: downEvents.length,
            },
            aiSummary,
            performanceAnalysis,
            charts: {
                histogram: histogramBuckets,
                heatmap: heatmapData,
                errorPie: downtimeForensics,
            }
        });

    } catch (error) {
        console.error('Error fetching monitor stats:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});


export default router;
