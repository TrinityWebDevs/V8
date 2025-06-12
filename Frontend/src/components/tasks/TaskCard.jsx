import React, { useState } from 'react';
import { useTask } from '../../context/TaskContext';
import TaskFormModal from './TaskFormModal';
import TimeLogList from './TimeLogList';

const TaskCard = ({ task }) => {
  const { updateTask, deleteTask, startTimer, stopTimer } = useTask();
  const [isEditing, setIsEditing] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(
    task.timeLogs.some(log => !log.end)
  );

  const handleStatusChange = async (newStatus) => {
    try {
      await updateTask(task._id, { status: newStatus });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleTimerToggle = async () => {
    try {
      if (isTimerRunning) {
        await stopTimer(task._id);
      } else {
        await startTimer(task._id);
      }
      setIsTimerRunning(!isTimerRunning);
    } catch (error) {
      console.error('Failed to toggle timer:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(task._id);
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-600 text-white';
      case 'medium':
        return 'bg-yellow-500 text-black';
      case 'low':
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'in-progress':
        return 'bg-blue-500 text-white';
      case 'todo':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  return (
    <div className="bg-gray-900 text-white rounded-xl shadow-lg p-6 transition duration-300 hover:shadow-2xl">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-white">{task.title}</h3>
        <div className="flex gap-3">
          <button onClick={() => setIsEditing(true)} className="text-gray-300 hover:text-white">
            ✎
          </button>
          <button onClick={handleDelete} className="text-red-400 hover:text-red-600">
            🗑
          </button>
        </div>
      </div>

      <p className="text-gray-300 mb-4">{task.description}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`px-2 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
        <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
          {task.status}
        </span>
      </div>

      {task.assignedTo && task.assignedTo.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-2">Assigned to:</p>
          <div className="flex -space-x-3 overflow-hidden">
            {task.assignedTo.map((assignee) => (
              <div key={assignee._id} className="relative group">
                <img
                  src={assignee.photo || '/default-avatar.png'}
                  alt={assignee.name}
                  className="w-8 h-8 rounded-full border-2 border-gray-800 object-cover"
                />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  {assignee.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {task.deadline && (
        <div className="mb-4 text-sm text-gray-400">
          Due: {new Date(task.deadline).toLocaleDateString()}
        </div>
      )}

      <div className="flex gap-3 items-center mb-4">
        <button
          onClick={handleTimerToggle}
          className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${
            isTimerRunning
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isTimerRunning ? 'Stop Timer' : 'Start Timer'}
        </button>

        <select
          value={task.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="bg-gray-800 text-white border border-gray-700 rounded px-2 py-1 text-sm"
        >
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <TimeLogList timeLogs={task.timeLogs}  />

      {isEditing && (
        <TaskFormModal
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          task={task}
          projectId={task.projectId}
        />
      )}
    </div>
  );
};

export default TaskCard;
