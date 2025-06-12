import axios from 'axios';

// Create a pre-configured Axios instance
const apiClient = axios.create({
  baseURL: 'http://localhost:3000/task',
  withCredentials: true, // Allow sending cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

const taskService = {
  // Get all tasks for a project
  getTasks: async (projectId) => {
    const response = await apiClient.get(`?projectId=${projectId}`);
    return response.data;
  },

  // Get a single task by ID
  getTask: async (taskId) => {
    const response = await apiClient.get(`/${taskId}`);
    return response.data;
  },

  // Create a new task
  createTask: async (taskData) => {
    const response = await apiClient.post('/', taskData);
    return response.data;
  },

  // Update an existing task
  updateTask: async (taskId, taskData) => {
    const response = await apiClient.put(`/${taskId}`, taskData);
    return response.data;
  },

  // Delete a task
  deleteTask: async (taskId) => {
    const response = await apiClient.delete(`/${taskId}`);
    return response.data;
  },

  // Start a task timer
  startTimer: async (taskId) => {
    const response = await apiClient.post(`/${taskId}/timelog/start`);
    return response.data;
  },

  // Stop a task timer
  stopTimer: async (taskId) => {
    const response = await apiClient.post(`/${taskId}/timelog/stop`);
    return response.data;
  }
};

export default taskService;
