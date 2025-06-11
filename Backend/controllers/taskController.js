import Task from '../model/Task.js';
import User from '../model/user.js';
import { sendTaskAssignmentEmail, sendDeadlineReminderEmail } from '../utils/emailService.js';

// Get all tasks for a project
export const getTasks = async (req, res) => {
  try {
    const { projectId } = req.query;
    const tasks = await Task.find({ projectId })
      .populate('assignedTo', 'name email photo')
      .populate('timeLogs.user', 'name')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single task
export const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email photo')
      .populate('timeLogs.user', 'name email');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new task
export const createTask = async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();

    // Send emails to all assigned users
    for (const userId of task.assignedTo) {
      const user = await User.findById(userId);
      if (user) {
        await sendTaskAssignmentEmail(user, task);
      }
    }

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update task
export const updateTask = async (req, res) => {
  try {
    const oldTask = await Task.findById(req.params.id);
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if assigned users have changed
    const newAssignedUsers = task.assignedTo.filter(
      userId => !oldTask.assignedTo.includes(userId)
    );

    // Send emails to newly assigned users
    for (const userId of newAssignedUsers) {
      const user = await User.findById(userId);
      if (user) {
        await sendTaskAssignmentEmail(user, task);
      }
    }

    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete task
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Start timer
export const startTimer = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if there's already an open timer
    const openTimer = task.timeLogs.find(log => !log.end);
    if (openTimer) {
      return res.status(400).json({ message: 'Timer already running' });
    }

    task.timeLogs.push({
      user: req.user._id,
      start: Date.now()
    });

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Stop timer
export const stopTimer = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const openTimer = task.timeLogs.find(log => !log.end);
    if (!openTimer) {
      return res.status(400).json({ message: 'No timer running' });
    }

    const endTime = Date.now();
    const duration = Math.floor((endTime - openTimer.start) / (1000 * 60)); // Convert to minutes

    openTimer.end = endTime;
    openTimer.duration = duration;

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a new function to check deadlines and send reminders
export const checkDeadlines = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await Task.find({
      deadline: {
        $gte: today,
        $lt: tomorrow
      },
      status: { $ne: 'completed' }
    }).populate('assignedTo');

    for (const task of tasks) {
      for (const user of task.assignedTo) {
        await sendDeadlineReminderEmail(user, task);
      }
    }
  } catch (error) {
    console.error('Error checking deadlines:', error);
  }
}; 