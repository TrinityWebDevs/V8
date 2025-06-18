import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { format } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const MonitorDetailModal = ({ monitor, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [uptimePercentage, setUptimePercentage] = useState('N/A');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/monitors/${monitor._id}/stats`, { withCredentials: true });
        setStats(response.data.stats);
        setUptimePercentage(response.data.uptimePercentage);
      } catch (error) {
        console.error('Failed to fetch monitor stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (monitor) {
      fetchStats();
    }
  }, [monitor]);

  const chartData = {
    labels: stats.map(s => format(new Date(s.timestamp), 'HH:mm')), // Format timestamp to show only time
    datasets: [
      {
        label: 'Response Time (ms)',
        data: stats.map(s => s.responseTime),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Response Time (Last 24 Hours)',
      },
    },
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-gray-800 text-white rounded-lg shadow-xl p-6 w-full max-w-3xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{monitor.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>
        {loading ? (
          <p>Loading stats...</p>
        ) : (
          <div>
            <div className="mb-6 text-center">
              <p className="text-lg">Uptime (Last 24h)</p>
              <p className="text-4xl font-bold text-green-400">{uptimePercentage}%</p>
            </div>
            <div className="mb-6">
              <Line options={chartOptions} data={chartData} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonitorDetailModal;
