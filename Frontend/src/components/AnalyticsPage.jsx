// src/pages/AnalyticsPage.jsx
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { ChevronDown } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const BACKEND = 'http://localhost:3000'

export default function AnalyticsPage({ project, shortCode }) {
  const projectId = project._id
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeRange, setTimeRange] = useState('7d') // '24h', '7d', '30d', '1y'

  // Tabs for “Devices” box (not needed, devices are shown together)
  // Tabs for “Links / Destinations” (moved to bottom)
  const [leftTab, setLeftTab] = useState('links')

  // Tabs for “Countries / Cities / Continents”
  const [rightTab, setRightTab] = useState('countries')

  // Whenever projectId, shortCode, or timeRange changes, refetch EVERYTHING:
  useEffect(() => {
    setLoading(true)
    setError('')
    let url = `${BACKEND}/analytics/project/${projectId}?timeRange=${timeRange}`
    if (shortCode) {
      url += `&shortCode=${encodeURIComponent(shortCode)}`
    }

    axios
      .get(url, { withCredentials: true })
      .then((res) => {
        setData(res.data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to fetch analytics')
        setLoading(false)
      })
  }, [projectId, shortCode, timeRange])

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-900 text-gray-100">
        <svg
          className="animate-spin h-10 w-10 text-indigo-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          ></path>
        </svg>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-900 text-red-400">
        <div className="text-center p-6 bg-gray-800 rounded-lg shadow-md">
          <h3 className="text-xl font-medium mb-2">Error Loading Analytics</h3>
          <p className="text-gray-400">{error}</p>
          <button
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  // ─────────── Build “Clicks Over Time” (Line) ───────────
  const clicksTrendDataConfig = {
    labels: (data.clicksTrend || []).map((d) => d._id || d.date),
    datasets: [
      {
        label: 'Clicks',
        data: (data.clicksTrend || []).map((d) => d.count),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: '#1D4ED8',
        pointBorderColor: '#fff',
        fill: true,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1F2937',
        titleColor: '#F9FAFB',
        bodyColor: '#D1D5DB',
        padding: 10,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#9CA3AF', font: { size: 12 } },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#9CA3AF',
          precision: 0,
          stepSize: 1,
          callback: (value) => (value % 1 === 0 ? value : ''),
        },
        beginAtZero: true,
      },
    },
  }

  // ─────────── Time Filters ───────────
  const timeFilters = [
    { value: '24h', label: 'Last 24h' },
    { value: '7d', label: 'Last 7d' },
    { value: '30d', label: 'Last 30d' },
    { value: '1y', label: 'Last 1y' },
  ]

  // ─────────── Device Data ───────────
  const topBrowsers = data.topBrowsers || []
  const topOS = data.topOS || []
  const topDeviceTypes = data.topDeviceTypes || []

  // ─────────── Location Data ───────────
  const rightCountries = data.topCountries || []
  const rightCities = data.topCities || []
  const rightContinents = data.topContinents || []

  // ─────────── Links / Destinations Data ───────────
  const leftLinks = data.singleLink
    ? [{ shortCode: data.shortCode, clicks: data.totalClicks }]
    : (data.links || []).map((l) => ({ shortCode: l.shortCode, clicks: l.clickCount }))

  const leftDestinations = data.singleLink
    ? [{ originalUrl: data.originalUrl, clicks: data.totalClicks }]
    : (data.links || []).map((l) => ({ originalUrl: l.originalUrl, clicks: l.clickCount }))

  // ─────────── Helper: Render List with Horizontal Bars ───────────
  const renderDataList = (title, items, maxItems = 5) => {
    if (!items || items.length === 0) {
      return (
        <div className="bg-gray-800 rounded-md p-3 border border-gray-700 mb-4">
          <h3 className="font-medium text-gray-200 mb-2">{title}</h3>
          <p className="text-gray-500 text-sm">No data available</p>
        </div>
      )
    }
    const maxCount = Math.max(...items.slice(0, maxItems).map((i) => i.count))
    return (
      <div className="bg-gray-800 rounded-md p-3 border border-gray-700 mb-4">
        <h3 className="font-medium text-gray-200 mb-2">{title}</h3>
        <div className="space-y-2">
          {items.slice(0, maxItems).map((item, i) => (
            <div key={`${item._id}-${i}`} className="flex items-center">
              <div className="w-32 truncate text-sm text-gray-200">{item._id || 'Unknown'}</div>
              <div className="flex-1 mx-2">
                <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-blue-500"
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
              <div className="w-10 text-right text-sm text-gray-200">{item.count}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ─────────── Header & Time Filter ─────────── */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">
              {data.singleLink ? `Analytics for /${data.shortCode}` : 'Project Analytics'}
            </h1>
            {data.singleLink && (
              <p className="text-gray-400 text-sm">{data.originalUrl}</p>
            )}
          </div>
          <div className="relative inline-block text-left">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none bg-gray-800 text-gray-200 py-2 pl-3 pr-8 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {timeFilters.map((f) => (
                <option key={f.value} value={f.value} className="bg-gray-800 text-white">
                  {f.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronDown size={16} className="text-gray-400" />
            </div>
          </div>
        </div>

        {/* ─────────── Clicks Over Time ─────────── */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-md">
          <h2 className="text-lg font-semibold mb-3">Clicks Over Time</h2>
          <div className="h-64">
            <Line data={clicksTrendDataConfig} options={chartOptions} />
          </div>
        </div>

        {/* ─────────── Two-Column Grid: Devices & Locations ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Devices */}
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-md space-y-4">
            <h2 className="text-lg font-semibold mb-3">Devices</h2>
            {renderDataList('Browsers', topBrowsers)}
            {renderDataList('Operating Systems', topOS)}
            {renderDataList('Device Types', topDeviceTypes)}
          </div>

          {/* Column 2: Countries / Cities / Continents */}
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-md">
            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => setRightTab('countries')}
                className={`px-4 py-1 rounded-t-md border-b-2 ${
                  rightTab === 'countries'
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                Countries
              </button>
              <button
                onClick={() => setRightTab('cities')}
                className={`px-4 py-1 rounded-t-md border-b-2 ${
                  rightTab === 'cities'
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                Cities
              </button>
              <button
                onClick={() => setRightTab('continents')}
                className={`px-4 py-1 rounded-t-md border-b-2 ${
                  rightTab === 'continents'
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                Continents
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-700">
                  <tr>
                    <th className="py-2 px-3 text-left text-gray-400 text-sm">
                      {rightTab.charAt(0).toUpperCase() + rightTab.slice(1, -1)}
                    </th>
                    <th className="py-2 px-3 text-right text-gray-400 text-sm">
                      Clicks
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rightTab === 'countries' ? (
                    rightCountries.length > 0 ? (
                      rightCountries.map((item) => (
                        <tr
                          key={item._id}
                          className="border-b border-gray-700 hover:bg-gray-800/50"
                        >
                          <td className="py-2 px-3 text-gray-200 truncate max-w-xs flex items-center space-x-2">
                            {item._id && (
                              <img
                                src={`https://flagcdn.com/16x12/${item._id
                                  .toLowerCase()
                                  .slice(0, 2)}.png`}
                                alt=""
                                className="w-4 h-3 rounded-sm"
                                onError={(e) => (e.target.style.display = 'none')}
                              />
                            )}
                            <span>{item._id || 'Unknown'}</span>
                          </td>
                          <td className="py-2 px-3 text-right text-gray-200">{item.count}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="py-4 text-center text-gray-500">
                          No country data.
                        </td>
                      </tr>
                    )
                  ) : rightTab === 'cities' ? (
                    rightCities.length > 0 ? (
                      rightCities.map((item, idx) => (
                        <tr
                          key={`${item._id}-${idx}`}
                          className="border-b border-gray-700 hover:bg-gray-800/50"
                        >
                          <td className="py-2 px-3 text-gray-200 truncate max-w-xs">
                            {item._id || 'Unknown'}
                          </td>
                          <td className="py-2 px-3 text-right text-gray-200">{item.count}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="py-4 text-center text-gray-500">
                          No city data.
                        </td>
                      </tr>
                    )
                  ) : rightContinents.length > 0 ? (
                    rightContinents.map((item) => (
                      <tr
                        key={item._id}
                        className="border-b border-gray-700 hover:bg-gray-800/50"
                      >
                        <td className="py-2 px-3 text-gray-200">{item._id || 'Unknown'}</td>
                        <td className="py-2 px-3 text-right text-gray-200">{item.count}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="py-4 text-center text-gray-500">
                        No continent data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ─────────── Bottom: Short Links / Destination URLs (Full Width) ─────────── */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-md">
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setLeftTab('links')}
              className={`px-4 py-1 rounded-t-md border-b-2 ${
                leftTab === 'links'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              Short Links
            </button>
            <button
              onClick={() => setLeftTab('destinations')}
              className={`px-4 py-1 rounded-t-md border-b-2 ${
                leftTab === 'destinations'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              Destination URLs
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-700">
                <tr>
                  {leftTab === 'links' ? (
                    <>
                      <th className="py-2 px-3 text-left text-gray-400 text-sm">Link</th>
                      <th className="py-2 px-3 text-right text-gray-400 text-sm">Clicks</th>
                    </>
                  ) : (
                    <>
                      <th className="py-2 px-3 text-left text-gray-400 text-sm">Destination</th>
                      <th className="py-2 px-3 text-right text-gray-400 text-sm">Clicks</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {leftTab === 'links' ? (
                  leftLinks.length > 0 ? (
                    leftLinks.map((item) => (
                      <tr
                        key={item.shortCode}
                        className="border-b border-gray-700 hover:bg-gray-800/50"
                      >
                        <td className="py-2 px-3 text-indigo-400 font-mono">/{item.shortCode}</td>
                        <td className="py-2 px-3 text-right text-gray-200">{item.clicks}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="py-4 text-center text-gray-500">
                        No links found.
                      </td>
                    </tr>
                  )
                ) : leftTab === 'destinations' ? (
                  leftDestinations.length > 0 ? (
                    leftDestinations.map((item, idx) => (
                      <tr
                        key={`${item.originalUrl}-${idx}`}
                        className="border-b border-gray-700 hover:bg-gray-800/50"
                      >
                        <td className="py-2 px-3 text-gray-200 truncate max-w-xs">{item.originalUrl}</td>
                        <td className="py-2 px-3 text-right text-gray-200">{item.clicks}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="py-4 text-center text-gray-500">
                        No destinations found.
                      </td>
                    </tr>
                  )
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
