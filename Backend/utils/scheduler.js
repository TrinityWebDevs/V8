import cron from 'node-cron';
import { checkDeadlines } from '../controllers/taskController.js';
import { Monitor } from '../model/monitor.js';
import { checkMonitorStatus } from '../services/monitoringService.js';

console.log('🕒 Scheduler initialized.');

// Job 1: Uptime Monitoring (each monitor checked at its own interval)
// ---------------------------------------------------
import EventEmitter from 'events';

const monitorTimers = {};
export const monitorEvents = new EventEmitter();

async function scheduleMonitor(monitor) {
  if (monitorTimers[monitor._id]) {
    clearTimeout(monitorTimers[monitor._id]);
  }

  const now = new Date();
  let delay = monitor.interval * 1000; // Default to the monitor's interval

  if (monitor.lastChecked) {
    const elapsed = now.getTime() - new Date(monitor.lastChecked).getTime();
    delay = Math.max(0, (monitor.interval * 1000) - elapsed);
  }

  monitorTimers[monitor._id] = setTimeout(async () => {
    try {
      await checkMonitorStatus(monitor);
    } catch (error) {
      console.error(`[Scheduler] Error checking monitor ${monitor.name}:`, error);
      // Even if it failed, we reschedule to try again later.
    } finally {
      // ALWAYS reschedule the next check, even if the monitor was deleted or paused.
      const latestMonitor = await Monitor.findById(monitor._id);
      if (latestMonitor && !latestMonitor.isPaused) {
        scheduleMonitor(latestMonitor);
      } else {
        // If monitor is deleted or paused, clear the timer.
        clearTimeout(monitorTimers[monitor._id]);
        delete monitorTimers[monitor._id];
      }
    }
  }, delay);
}

// On server start, schedule all monitors
(async () => {
  const monitors = await Monitor.find({ isPaused: false });
  monitors.forEach(scheduleMonitor);
})();

// Listen for monitor changes (add, remove, pause, resume)
monitorEvents.on('reschedule', async (monitorId) => {
  const monitor = await Monitor.findById(monitorId);
  if (monitor && !monitor.isPaused) {
    scheduleMonitor(monitor);
  } else if (monitorTimers[monitorId]) {
    clearTimeout(monitorTimers[monitorId]);
    delete monitorTimers[monitorId];
  }
});


// Job 2: Task Deadline Checker (runs daily at midnight)
// -----------------------------------------------------
cron.schedule('0 0 * * *', () => {
  console.log('Running daily task deadline check...');
  checkDeadlines();
}, {
  timezone: "Asia/Kolkata" // Use a specific timezone if necessary
});

// Optional: Run deadline check on server start as before
console.log('Running initial task deadline check on server start.');
checkDeadlines();