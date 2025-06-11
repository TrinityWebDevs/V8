import express from 'express';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  startTimer,
  stopTimer
} from '../controllers/taskController.js';
import protectRoutes from '../middleware/protectRoutes.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protectRoutes);

// Task CRUD routes
router.get('/', getTasks);
router.get('/:id', getTask);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

// Timer routes
router.post('/:id/timelog/start', startTimer);
router.post('/:id/timelog/stop', stopTimer);

export default router; 