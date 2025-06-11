import Task from '../model/Task.js';

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
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update task
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
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