import { checkDeadlines } from '../controllers/taskController.js';

// Run the deadline checker once when the server starts
checkDeadlines();

// Schedule the deadline checker to run daily at midnight
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    checkDeadlines();
  }
}, 60000); // Check every minute 