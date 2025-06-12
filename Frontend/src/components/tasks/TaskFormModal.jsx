import React, { useState, useEffect } from 'react';
import { useTask } from '../../context/TaskContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const TaskFormModal = ({ isOpen, onClose, task, projectId, project }) => {
  const { createTask, updateTask } = useTask();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: [],
    priority: 'medium',
    status: 'todo',
    deadline: null
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        assignedTo: task.assignedTo || [],
        priority: task.priority,
        status: task.status,
        deadline: task.deadline ? new Date(task.deadline) : null
      });
    }
  }, [task]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const taskData = {
        ...formData,
        projectId,
        deadline: formData.deadline ? formData.deadline.toISOString() : null
      };

      if (task) {
        await updateTask(task._id, taskData);
      } else {
        await createTask(taskData);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const removeSelectedMember = () => {
    setFormData({ ...formData, assignedTo: [] });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 text-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {task ? 'Edit Task' : 'Create Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 w-full rounded-md bg-zinc-800 border border-zinc-700 p-2 text-white focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 w-full rounded-md bg-zinc-800 border border-zinc-700 p-2 text-white focus:ring-blue-500 focus:border-blue-500"
                rows="3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Assign To</label>
              <select
                value=""
                onChange={(e) => {
                  const memberId = e.target.value;
                  if (memberId && !formData.assignedTo.includes(memberId)) {
                    setFormData({ ...formData, assignedTo: [...formData.assignedTo, memberId] });
                  }
                }}
                className="w-full rounded-md bg-zinc-800 border border-zinc-700 p-2 text-white focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select team members</option>
                {project?.members?.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </select>

              <div className="mt-2 flex flex-wrap gap-2">
                {formData.assignedTo.map((memberId) => {
                  const member = project?.members?.find(m => m._id === memberId);
                  return member ? (
                    <div key={memberId} className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1">
                      <img
                        src={member.photo || '/default-avatar.png'}
                        alt={member.name}
                        className="h-6 w-6 rounded-full object-cover"
                      />
                      <span className="text-sm">{member.name}</span>
                      <button
                        onClick={() => setFormData({
                          ...formData,
                          assignedTo: formData.assignedTo.filter(id => id !== memberId)
                        })}
                        type="button"
                        className="text-gray-400 hover:text-red-400 ml-2"
                      >
                        &times;
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="mt-1 w-full rounded-md bg-zinc-800 border border-zinc-700 p-2 text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 w-full rounded-md bg-zinc-800 border border-zinc-700 p-2 text-white"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Deadline</label>
              <DatePicker
                selected={formData.deadline}
                onChange={(date) => setFormData({ ...formData, deadline: date })}
                className="mt-1 w-full rounded-md bg-zinc-800 border border-zinc-700 p-2 text-white"
                dateFormat="MM/dd/yyyy"
                isClearable
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-600 rounded-md text-gray-300 hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {task ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskFormModal;
