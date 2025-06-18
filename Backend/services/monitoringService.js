import axios from 'axios';
import { Monitor, StatusCheck } from '../model/monitor.js';
import { analyzeDowntime } from './aiService.js';

/**
 * Checks the status of a single monitor.
 * @param {object} monitor - The monitor document from MongoDB.
 */
export const checkMonitorStatus = async (monitor) => {
  const startTime = Date.now();
  let status = 'Down';
  let responseTime = null;
  let rawError = null;

  console.log(`[Monitor] Checking: ${monitor.name} (${monitor.url}) at ${new Date().toISOString()}`);
  try {
    const response = await axios.get(monitor.url, { timeout: 10000 }); // 10-second timeout
    responseTime = Date.now() - startTime;

    // We consider any 2xx or 3xx status code as 'Up'.
    if (response.status >= 200 && response.status < 400) {
      status = 'Up';
    }
  } catch (error) {
    // Any error (network, timeout, 4xx/5xx status) is considered 'Down'.
    status = 'Down';
    responseTime = Date.now() - startTime;
    rawError = error.message;
    console.log(`Monitor '${monitor.name}' (${monitor.url}) is down. Error: ${rawError}`);
  }

  try {
    // Create a new status check log
    let aiAnalysis = null;
    if (status === 'Down' && rawError) {
      aiAnalysis = await analyzeDowntime(rawError);
    }

    const newStatusCheck = new StatusCheck({
      monitor: monitor._id,
      status,
      responseTime,
      error: rawError,
      aiAnalysis,
    });
    await newStatusCheck.save();
    console.log(`[Monitor] Status saved: ${monitor.name} - ${status} at ${new Date().toISOString()}`);

    // Update the monitor with the latest status
    monitor.latestStatus = status;
    monitor.lastChecked = new Date();
    await monitor.save();

    // Emit a socket event with the full updated monitor object
    if (global.io) {
      global.io.emit('monitorChecked', { monitor: monitor.toObject() });
    }
    // TODO: Trigger notification if status changed

  } catch (dbError) {
    console.error(`Failed to save status for monitor ${monitor.name}:`, dbError);
  }
};
