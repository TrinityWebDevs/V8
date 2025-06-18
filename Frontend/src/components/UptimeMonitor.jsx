import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircleIcon, TrashIcon, PlayIcon, PauseIcon, ChartBarIcon, ClockIcon } from '@heroicons/react/24/solid';
import { ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import NextCheckCountdown from './NextCheckCountdown';
import HackerTerminalModal from './HackerTerminalModal';
import io from 'socket.io-client';

const UptimeMonitor = ({ project }) => {
  const [monitors, setMonitors] = useState([]);
  const [statusHistory, setStatusHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMonitorName, setNewMonitorName] = useState('');
  const [newMonitorUrl, setNewMonitorUrl] = useState('');
  const [newMonitorInterval, setNewMonitorInterval] = useState('60');
  const [selectedMonitor, setSelectedMonitor] = useState(null);
  const [error, setError] = useState(null);

  const fetchMonitors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/monitors/${project._id}`, {
        withCredentials: true,
      });
      setMonitors(response.data);
    } catch (error) {
      console.error('Failed to fetch monitors:', error);
      setError('Failed to fetch monitors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (project?._id) {
      fetchMonitors();
    }
  }, [project]);

  // Socket.IO real-time updates
  useEffect(() => {
    const socket = io(`${import.meta.env.VITE_BACKEND_URL}`, {
      withCredentials: true,
      transports: ['websocket'],
    });
    
    socket.on('connect', () => {
      console.log('Connected to real-time monitoring');
    });
    
    socket.on('monitorChecked', async ({ monitor }) => {
      setMonitors((prevMonitors) =>
        prevMonitors.map((m) => (m._id === monitor._id ? monitor : m))
      );
      await fetchStatusHistory(monitor._id);
    });
    
    return () => {
      socket.disconnect();
    };
  }, [project?._id]);

  const handleAddMonitor = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/monitors/create`, {
        projectId: project._id,
        name: newMonitorName,
        url: newMonitorUrl,
        interval: Number(newMonitorInterval),
      }, { withCredentials: true });
      
      setShowAddModal(false);
      setNewMonitorName('');
      setNewMonitorUrl('');
      setNewMonitorInterval('60');
      fetchMonitors();
    } catch (error) {
      console.error('Failed to add monitor:', error);
      setError('Failed to add monitor. Please check your inputs and try again.');
    }
  };

  const handleDeleteMonitor = async (monitorId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this monitor? This action cannot be undone.')) {
      try {
        await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/monitors/${monitorId}`, { 
          withCredentials: true 
        });
        fetchMonitors();
      } catch (error) {
        console.error('Failed to delete monitor:', error);
        setError('Failed to delete monitor. Please try again.');
      }
    }
  };

  const fetchStatusHistory = async (monitorId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/monitors/${monitorId}/history?limit=50`, { 
        withCredentials: true 
      });
      let history = res.data.history || [];
      
      if (history.length > 30) {
        history = history.slice(5, 30);
      }
      
      setStatusHistory((prev) => {
        const prevHistory = prev[monitorId] || [];
        const isSame = prevHistory.length === history.length && 
          prevHistory.every((h, i) => h.status === history[i]?.status && h.timestamp === history[i]?.timestamp);
        
        if (isSame) return prev;
        return { ...prev, [monitorId]: history };
      });
    } catch (error) {
      console.error('Failed to fetch status history for monitor', monitorId, error);
      setStatusHistory((prev) => ({ ...prev, [monitorId]: [] }));
    }
  };

  useEffect(() => {
    if (monitors.length > 0) {
      monitors.forEach((monitor) => fetchStatusHistory(monitor._id));
    }
  }, [monitors]);

  const handleMonitorClick = (monitor) => {
    setSelectedMonitor(monitor);
  };

  const handleCloseModal = () => {
    setSelectedMonitor(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Up':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'Down':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getUptimePercentage = (monitorId) => {
    const history = statusHistory[monitorId] || [];
    if (history.length === 0) return '100';
    const upCount = history.filter(entry => entry.status === 'Up').length;
    return ((upCount / history.length) * 100).toFixed(1);
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <ChartBarIcon className="h-8 w-8 text-blue-500" />
                Uptime Monitor
              </h1>
              <p className="text-slate-400 mt-1">Monitor your websites and APIs in real-time</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 shadow-lg"
            >
              <PlusCircleIcon className="h-5 w-5" />
              Add Monitor
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-900/50 border border-red-700 rounded-lg p-4 flex items-center gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
            <p className="text-red-200">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              ×
            </button>
          </div>
        )}

        {/* Monitors Grid */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-slate-400">Loading monitors...</span>
            </div>
          ) : monitors.length === 0 ? (
            <div className="text-center py-16 px-6">
              <ChartBarIcon className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No monitors configured</h3>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                Start monitoring your websites and APIs by adding your first monitor. 
                Get real-time alerts and detailed uptime analytics.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                <PlusCircleIcon className="h-4 w-4" />
                Add Your First Monitor
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {monitors.map((monitor) => (
                <div 
                  key={monitor._id} 
                  className="p-6 hover:bg-slate-700/50 cursor-pointer transition-all duration-200 group"
                  onClick={() => handleMonitorClick(monitor)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Status Indicator */}
                      <div className="flex-shrink-0">
                        {getStatusIcon(monitor.latestStatus)}
                      </div>
                      
                      {/* Monitor Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-white truncate">{monitor.name}</h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            monitor.latestStatus === 'Up' ? 'bg-green-900/50 text-green-300 border border-green-700' :
                            monitor.latestStatus === 'Down' ? 'bg-red-900/50 text-red-300 border border-red-700' :
                            'bg-yellow-900/50 text-yellow-300 border border-yellow-700'
                          }`}>
                            {monitor.latestStatus || 'Pending'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 truncate">{monitor.url}</p>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center gap-6 text-sm">
                      {/* Uptime Percentage */}
                      <div className="text-center">
                        <div className="text-lg font-semibold text-white">
                          {getUptimePercentage(monitor._id)}%
                        </div>
                        <div className="text-xs text-slate-400">Uptime</div>
                      </div>

                      {/* Status History */}
                      <div className="flex items-center gap-1">
                        {(() => {
                          const history = statusHistory[monitor._id] || [];
                          const BLOCK_COUNT = 30;
                          const blocks = Array(BLOCK_COUNT).fill(null);
                          
                          for (let i = 0; i < history.length && i < BLOCK_COUNT; i++) {
                            blocks[i] = history[i];
                          }
                          
                          return blocks.map((entry, idx) => (
                            <div
                              key={idx}
                              title={entry ? `${entry.status} at ${new Date(entry.timestamp).toLocaleString()}${entry.status === 'Down' && entry.aiAnalysis ? `\n${entry.aiAnalysis}` : ''}` : 'No data'}
                              className={`w-1 h-8 rounded-sm transition-all duration-200 ${
                                entry?.status === 'Up' ? 'bg-green-500' :
                                entry?.status === 'Down' ? 'bg-red-500' :
                                'bg-slate-600'
                              } hover:scale-110 cursor-help`}
                            />
                          ));
                        })()}
                      </div>

                      {/* Next Check */}
                      <div className="flex items-center gap-2 text-slate-400">
                        <ClockIcon className="h-4 w-4" />
                        <NextCheckCountdown interval={monitor.interval} lastChecked={monitor.lastChecked} />
                      </div>

                      {/* Actions */}
                      <button
                        onClick={(e) => handleDeleteMonitor(monitor._id, e)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        aria-label="Delete monitor"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Monitor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white">Add New Monitor</h2>
              <p className="text-slate-400 mt-1">Configure monitoring for your website or API</p>
            </div>
            
            <form onSubmit={handleAddMonitor} className="p-6 space-y-6">
              <div>
                <label htmlFor="monitor-name" className="block text-sm font-medium text-slate-300 mb-2">
                  Monitor Name *
                </label>
                <input
                  id="monitor-name"
                  type="text"
                  value={newMonitorName}
                  onChange={(e) => setNewMonitorName(e.target.value)}
                  placeholder="e.g., My Personal Blog"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="monitor-url" className="block text-sm font-medium text-slate-300 mb-2">
                  URL *
                </label>
                <input
                  id="monitor-url"
                  type="url"
                  value={newMonitorUrl}
                  onChange={(e) => setNewMonitorUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="monitor-interval" className="block text-sm font-medium text-slate-300 mb-2">
                  Check Interval (seconds) *
                </label>
                <select
                  id="monitor-interval"
                  value={newMonitorInterval}
                  onChange={(e) => setNewMonitorInterval(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                >
                  <option value="30">30 seconds</option>
                  <option value="60">1 minute</option>
                  <option value="300">5 minutes</option>
                  <option value="600">10 minutes</option>
                  <option value="1800">30 minutes</option>
                  <option value="3600">1 hour</option>
                </select>
                <p className="text-xs text-slate-400 mt-1">How often to check if your site is up</p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                >
                  Add Monitor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Monitor Details Modal */}
      {selectedMonitor && (
        <HackerTerminalModal
          monitor={selectedMonitor}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default UptimeMonitor;