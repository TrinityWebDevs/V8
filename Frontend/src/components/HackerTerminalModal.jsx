import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { BACKEND } from '../utils/config.js';
import axios from 'axios';
import { Line, Doughnut, Bar, Pie } from 'react-chartjs-2';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement);

// Mock icons
const XMarkIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CpuChipIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-1.5 8.25V21M8.25 21v-1.5m8.25 0V21m-1.5-13.5v6.75a3 3 0 01-3 3h-6.75a3 3 0 01-3-3V6.75a3 3 0 013-3H15a3 3 0 013 3v.75z" />
  </svg>
);

const BeakerIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5a2.25 2.25 0 00-.659 1.591V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25v-3.409a2.25 2.25 0 00-.659-1.591L14.25 10.409a2.25 2.25 0 01-.659-1.591V3.104a48.554 48.554 0 00-3.478-.546 48.696 48.696 0 00-3.478.546z" />
  </svg>
);

const CommandLineIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const HackerTerminalModal = ({ monitor, onClose }) => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [socket, setSocket] = useState(null);
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('24h');
  const [diagnosticOutput, setDiagnosticOutput] = useState([]);
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);

  useEffect(() => {
    const s = io(BACKEND, { withCredentials: true, transports: ['websocket'] });
    setSocket(s);
    return () => s.disconnect();
  }, []);

  useEffect(() => {
    if (!monitor?._id) return;
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${BACKEND}/api/monitors/${monitor._id}/history?limit=10000`, { withCredentials: true });
        const counts = {};
        (res.data.history || []).forEach((h) => {
          const dateKey = new Date(h.timestamp).toISOString().split('T')[0];
          if (!counts[dateKey]) counts[dateKey] = 0;
          if (h.status !== 'Up') counts[dateKey] += 1;
        });
        const dataArr = Object.entries(counts).map(([date, count]) => ({ date, count }));
        setHeatmapData(dataArr);
      } catch (err) {
        console.error('Failed to fetch heatmap history', err);
      }
    };
    fetchHistory();
  }, [monitor?._id]);

  useEffect(() => {
    if (!monitor?._id) return;

    const fetchStats = async () => {
      try {
        const res = await axios.get(`${BACKEND}/api/monitors/${monitor._id}/stats?period=${period}`, { withCredentials: true });
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      }
    };

    fetchStats();
  }, [monitor?._id, period]);

  const handleRunDiagnostic = (tool) => {
    if (!socket || !monitor) return;

    if (!isDiagnosticRunning) {
      setDiagnosticOutput([]);
      setIsDiagnosticRunning(true);
      setDiagnosticOutput([`> Requesting ${tool} for ${monitor.url}...`]);
      socket.emit('run:diagnostic', { monitorId: monitor._id, tool });

      const handleOutput = (line) => setDiagnosticOutput((prev) => [...prev, line]);
      const handleEnd = (line) => {
        setDiagnosticOutput((prev) => [...prev, line]);
        setIsDiagnosticRunning(false);
        socket.off('diagnostic:output', handleOutput);
        socket.off('diagnostic:end', handleEnd);
        socket.off('diagnostic:error', handleError);
      };
      const handleError = (err) => {
        setDiagnosticOutput((prev) => [...prev, `ERROR: ${err}`]);
        setIsDiagnosticRunning(false);
      };

      socket.on('diagnostic:output', handleOutput);
      socket.on('diagnostic:end', handleEnd);
      socket.on('diagnostic:error', handleError);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const chartData = {
    labels: data?.stats.map(s => formatTime(s.timestamp)) || [],
    datasets: [
      {
        label: 'Response Time (ms)',
        data: data?.stats.map(s => s.responseTime) || [],
        borderColor: '#00ff00',
        backgroundColor: 'rgba(0, 255, 0, 0.1)',
        borderWidth: 2,
        pointBackgroundColor: '#00ff00',
        pointRadius: 2,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      x: {
        ticks: {
          color: '#00ff00',
          font: { family: "'Courier New', Courier, monospace", size: 10 },
          maxTicksLimit: 8
        },
        grid: { color: 'rgba(0, 255, 0, 0.2)' },
      },
      y: {
        ticks: {
          color: '#00ff00',
          font: { family: "'Courier New', Courier, monospace", size: 10 }
        },
        grid: { color: 'rgba(0, 255, 0, 0.2)' },
      },
    },
  };

  const histogramData = {
    labels: Object.keys(data?.charts?.histogram || {}),
    datasets: [{
      label: 'Response Time Distribution',
      data: Object.values(data?.charts?.histogram || {}),
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1,
    }]
  };

  const errorPieData = {
    labels: Object.keys(data?.charts?.errorPie || {}),
    datasets: [{
      data: Object.values(data?.charts?.errorPie || {}),
      backgroundColor: [
        'rgba(255, 99, 132, 0.6)',
        'rgba(255, 159, 64, 0.6)',
        'rgba(255, 205, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(54, 162, 235, 0.6)',
      ],
      hoverOffset: 4,
    }]
  };

  const doughnutChartData = {
    labels: ['Uptime', 'Downtime'],
    datasets: [
      {
        data: [
          parseFloat(data?.vitals.uptimePercentage) || 0,
          100 - (parseFloat(data?.vitals.uptimePercentage) || 0),
        ],
        backgroundColor: ['rgba(0, 255, 0, 0.7)', 'rgba(255, 0, 0, 0.7)'],
        borderColor: ['#000'],
        borderWidth: 2,
      },
    ],
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    cutout: '70%',
  };

  if (!monitor) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-7xl h-full max-h-[95vh] bg-gray-950 rounded-2xl shadow-2xl border border-green-600 flex items-center justify-center">
          <p className="text-xl text-yellow-400 font-mono">
            {'>> NO MONITOR SELECTED...'}
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-7xl h-full max-h-[95vh] bg-gray-950 rounded-2xl shadow-2xl border border-green-600 flex items-center justify-center">
          <p className="text-xl animate-pulse text-green-400 font-mono">
            {'>> ANALYZING DATA STREAM FOR ' + period.toUpperCase() + '...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-7xl h-full max-h-[95vh] bg-gray-950 rounded-2xl shadow-2xl border border-green-600 flex flex-col overflow-hidden">
        <div className="px-6 py-4 flex items-center gap-4 border-b border-green-800 bg-black bg-opacity-40 flex-shrink-0">
          <CpuChipIcon className="h-6 w-6 text-green-400 animate-pulse" />
          <h2 className="font-mono text-xl font-bold text-green-400 tracking-wider uppercase">
            MONITOR: <span className="text-green-200">{monitor.name}</span>
          </h2>
          <span className="ml-auto text-xs text-green-700 font-mono bg-black bg-opacity-40 px-3 py-1 rounded-full border border-green-800">
            {monitor.url}
          </span>
          <div className="flex items-center gap-2 ml-4">
            {['24h', '7d', '30d'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`font-mono uppercase px-3 py-1 rounded-full border text-xs transition-all duration-150 ${period === p
                  ? 'bg-green-500 text-black border-green-400 shadow-lg'
                  : 'border-green-600 bg-black bg-opacity-60 text-green-300 hover:bg-green-900 hover:text-green-100'
                  }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={onClose}
              className="text-green-400 hover:text-white ml-4 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full">
            <div className="md:col-span-8 bg-gray-900 bg-opacity-70 border border-green-700 rounded-xl p-4 flex flex-col">
              <h3 className="text-sm font-mono font-bold mb-3 border-b border-green-700 pb-2 tracking-wider text-green-300">
                RESPONSE TIME TELEMETRY ({period.toUpperCase()})
              </h3>
              <div className="flex-1 min-h-0">
                <Line options={chartOptions} data={chartData} />
              </div>
            </div>

            <div className="md:col-span-4 bg-gray-900 bg-opacity-70 border border-green-700 rounded-xl p-4 flex flex-col">
              <h3 className="text-sm font-mono font-bold mb-3 border-b border-green-700 pb-2 tracking-wider text-green-300">
                RELIABILITY
              </h3>
              <div className="flex-1 flex items-center justify-around">
                <div className="relative w-24 h-24">
                  <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-green-400">
                      {data.vitals.uptimePercentage}%
                    </span>
                  </div>
                </div>
                <div className="w-24 h-24">
                  <Pie data={errorPieData} options={doughnutChartOptions} />
                </div>
              </div>
            </div>

            <div className="md:col-span-8 bg-gray-900 bg-opacity-70 border border-green-700 rounded-xl p-4 flex flex-col">
              <h3 className="text-sm font-mono font-bold mb-3 border-b border-green-700 pb-2 tracking-wider text-green-300">
                RESPONSE DISTRIBUTION
              </h3>
              <div className="flex-1 min-h-0">
                <Bar options={chartOptions} data={histogramData} />
              </div>
            </div>

            <div className="md:col-span-4 bg-gray-900 bg-opacity-70 border border-green-700 rounded-xl p-4 flex flex-col">
              <h3 className="text-sm font-mono font-bold mb-3 border-b border-green-700 pb-2 tracking-wider text-green-300 flex items-center">
                <BeakerIcon className="h-4 w-4 mr-2" /> AI ANALYSIS
              </h3>
              <div className="flex-1 overflow-y-auto space-y-3">
                <div>
                  <p className="text-xs text-green-400 font-bold mb-1">THREATS:</p>
                  <p className="text-xs text-green-300">{data.aiSummary}</p>
                </div>
                <div>
                  <p className="text-xs text-green-400 font-bold mb-1">PERFORMANCE:</p>
                  <p className="text-xs text-green-300">{data.performanceAnalysis}</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-12 bg-gray-900 bg-opacity-70 border border-green-700 rounded-xl p-4 flex flex-col">
              <h3 className="text-sm font-mono font-bold mb-3 border-b border-green-700 pb-2 tracking-wider text-green-300 flex items-center">
                <CpuChipIcon className="h-4 w-4 mr-2" /> STATUS HEATMAP (LAST 12 MONTHS)
              </h3>
              <div className="overflow-x-auto">
                <CalendarHeatmap
                  startDate={new Date(new Date().setFullYear(new Date().getFullYear() - 1))}
                  endDate={new Date()}
                  values={heatmapData}
                  classForValue={(value) => {
                    if (!value) return 'color-empty';
                    if (value.count === 0) return 'color-github-0';
                    if (value.count < 3) return 'color-github-1';
                    if (value.count < 6) return 'color-github-2';
                    if (value.count < 10) return 'color-github-3';
                    return 'color-github-4';
                  }}
                  tooltipDataAttrs={(value) => {
                    if (!value || !value.date) return {};
                    return { 'data-tip': `${value.date} – ${value.count} incident(s)` };
                  }}
                  showWeekdayLabels
                />
              </div>
            </div>

            <div className="md:col-span-12 bg-gray-900 bg-opacity-70 border border-green-700 rounded-xl p-4 flex flex-col">
              <div className="flex justify-between items-center border-b border-green-700 pb-2 mb-3">
                <h3 className="text-sm font-mono font-bold tracking-wider text-green-300 flex items-center">
                  <CommandLineIcon className="h-4 w-4 mr-2" /> LIVE DIAGNOSTICS
                </h3>
                <div className="space-x-2">
                  <button
                    onClick={() => handleRunDiagnostic('ping')}
                    disabled={isDiagnosticRunning}
                    className="px-2 py-1 text-xs border border-green-700 text-green-300 hover:bg-green-900 disabled:opacity-50 rounded transition-colors font-mono"
                  >
                    PING
                  </button>
                  <button
                    onClick={() => handleRunDiagnostic('traceroute')}
                    disabled={isDiagnosticRunning}
                    className="px-2 py-1 text-xs border border-green-700 text-green-300 hover:bg-green-900 disabled:opacity-50 rounded transition-colors font-mono"
                  >
                    TRACEROUTE
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto bg-black bg-opacity-80 p-3 text-xs font-mono rounded-lg min-h-0">
                {diagnosticOutput.map((line, index) => (
                  <p key={index} className="whitespace-pre-wrap text-green-300 leading-relaxed">
                    {line}
                  </p>
                ))}
                {isDiagnosticRunning && (
                  <p className="animate-pulse text-green-400 mt-2">_</p>
                )}
                {diagnosticOutput.length === 0 && !isDiagnosticRunning && (
                  <p className="text-green-600 italic">Click a diagnostic tool to begin analysis...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HackerTerminalModal;
