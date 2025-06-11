import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import taskService from '../utils/taskService';

const TaskContext = createContext();

const initialState = {
  tasks: [],
  loading: false,
  error: null,
  currentProjectId: null
};

const taskReducer = (state, action) => {
  switch (action.type) {
    case 'SET_PROJECT':
      return { ...state, currentProjectId: action.payload };
    case 'FETCH_TASKS_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_TASKS_SUCCESS':
      return { ...state, loading: false, tasks: Array.isArray(action.payload) ? action.payload : [] };
    case 'FETCH_TASKS_ERROR':
      return { ...state, loading: false, error: action.payload, tasks: [] };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task._id === action.payload._id ? action.payload : task
        )
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task._id !== action.payload)
      };
    default:
      return state;
  }
};

export const TaskProvider = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  const fetchTasks = useCallback(async (projectId) => {
    try {
      dispatch({ type: 'FETCH_TASKS_START' });
      const response = await taskService.getTasks(projectId);
      const tasks = Array.isArray(response) ? response : [];
      dispatch({ type: 'FETCH_TASKS_SUCCESS', payload: tasks });
    } catch (error) {
      dispatch({ type: 'FETCH_TASKS_ERROR', payload: error.message });
    }
  }, []); // Empty dependency array since dispatch is stable

  const createTask = async (taskData) => {
    try {
      const newTask = await taskService.createTask(taskData);
      dispatch({ type: 'ADD_TASK', payload: newTask });
      return newTask;
    } catch (error) {
      throw error;
    }
  };

  const updateTask = async (taskId, taskData) => {
    try {
      const updatedTask = await taskService.updateTask(taskId, taskData);
      dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
      return updatedTask;
    } catch (error) {
      throw error;
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await taskService.deleteTask(taskId);
      dispatch({ type: 'DELETE_TASK', payload: taskId });
    } catch (error) {
      throw error;
    }
  };

  const startTimer = async (taskId) => {
    try {
      const updatedTask = await taskService.startTimer(taskId);
      dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
      return updatedTask;
    } catch (error) {
      throw error;
    }
  };

  const stopTimer = async (taskId) => {
    try {
      const updatedTask = await taskService.stopTimer(taskId);
      dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
      return updatedTask;
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    if (state.currentProjectId) {
      fetchTasks(state.currentProjectId);
    }
  }, [state.currentProjectId, fetchTasks]);

  return (
    <TaskContext.Provider
      value={{
        ...state,
        fetchTasks,
        createTask,
        updateTask,
        deleteTask,
        startTimer,
        stopTimer
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
}; 