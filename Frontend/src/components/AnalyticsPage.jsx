import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const BACKEND = 'http://localhost:3000';

export default function AnalyticsPage({ project }) {
  const projectId = project._id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    axios
      .get(`${BACKEND}/analytics/project/${projectId}`)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to fetch analytics');
        setLoading(false);
      });
  }, [projectId]);

  // Generate chart options for dark mode
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#E5E7EB',
          font: {
            size: 13,
          }
        }
      },
      tooltip: {
        backgroundColor: '#1F2937',
        titleColor: '#F9FAFB',
        bodyColor: '#D1D5DB',
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#9CA3AF',
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#9CA3AF',
          precision: 0,
        },
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-900">
        <div className="animate-pulse flex space-x-4">
          <div className="h-10 w-10 bg-blue-500 rounded-full"></div>
          <div className="flex-1 space-y-6 py-1">
            <div className="h-2 bg-gray-700 rounded"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-gray-700 rounded col-span-2"></div>
                <div className="h-2 bg-gray-700 rounded col-span-1"></div>
              </div>
              <div className="h-2 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-900 text-red-400">
        <div className="text-center p-6 bg-gray-800 rounded-lg max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-medium mt-4 mb-2">Error Loading Analytics</h3>
          <p className="text-gray-400">{error}</p>
          <button 
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Safe fallbacks
  const topBrowsers = data?.topBrowsers || [];
  const topCountries = data?.topCountries || [];
  const clicksTrend = data?.clicksTrend || [];
  const topLinks = data?.links || [];

  // Prepare chart data
  const topBrowsersData = {
    labels: topBrowsers.map((b) => b._id || 'Unknown'),
    datasets: [
      {
        label: 'Clicks',
        data: topBrowsers.map((b) => b.count),
        backgroundColor: '#3B82F6',
        borderRadius: 8,
      },
    ],
  };

  const topCountriesData = {
    labels: topCountries.map((c) => c._id || 'Unknown'),
    datasets: [
      {
        label: 'Clicks',
        data: topCountries.map((c) => c.count),
        backgroundColor: '#10B981',
        borderRadius: 8,
      },
    ],
  };

  const clicksTrendData = {
    labels: clicksTrend.map((day) => day.date),
    datasets: [
      {
        label: 'Clicks',
        data: clicksTrend.map((day) => day.count),
        fill: {
          target: 'origin',
          above: 'rgba(59, 130, 246, 0.1)',
        },
        borderColor: '#3B82F6',
        tension: 0.4,
        pointBackgroundColor: '#1D4ED8',
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
        pointRadius: 4,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            Project Analytics
          </h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-5 border border-gray-700 shadow-lg">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-400">Total Links</p>
                <p className="text-2xl font-bold">{data?.totalLinks || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-5 border border-gray-700 shadow-lg">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-500/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-400">Total Clicks</p>
                <p className="text-2xl font-bold">{data?.totalClicks || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Clicks Over Time */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-5 border border-gray-700 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Clicks Over Time (Last 7 Days)</h2>
            </div>
            <div className="h-72">
              <Line data={clicksTrendData} options={chartOptions} />
            </div>
          </div>
          
          {/* Top Browsers & Countries */}
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-5 border border-gray-700 shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Top Browsers</h2>
              <div className="h-72">
                <Bar data={topBrowsersData} options={chartOptions} />
              </div>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-5 border border-gray-700 shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Top Countries</h2>
              <div className="h-72">
                <Bar data={topCountriesData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* Top Links Table */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-5 border border-gray-700 shadow-lg">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Top Performing Links</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left text-gray-400 font-medium">Short URL</th>
                  <th className="py-3 px-4 text-left text-gray-400 font-medium">Destination</th>
                  <th className="py-3 px-4 text-left text-gray-400 font-medium">Created</th>
                  <th className="py-3 px-4 text-left text-gray-400 font-medium">Clicks</th>
                  <th className="py-3 px-4 text-right text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {topLinks.length > 0 ? (
                  topLinks.map((link) => (
                    <tr key={link._id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/30">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="bg-blue-500/10 p-1 rounded mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="font-mono text-blue-400">/{link.shortCode}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-gray-300">{link.originalUrl}</td>
                      <td className="py-3 px-4 text-gray-400 text-sm">
                        {new Date(link.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">{link.clickCount}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button className="text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded-lg transition">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="mt-4">No links created yet</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}