// src/pages/AnalyticsPage.jsx
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Bar, Line } from 'react-chartjs-2'
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
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
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

  useEffect(() => {
    setLoading(true)
    setError('')
    let url = `${BACKEND}/analytics/project/${projectId}`
    if (shortCode) {
      url += `?shortCode=${encodeURIComponent(shortCode)}`
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
  }, [projectId, shortCode])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#E5E7EB', font: { size: 13 } },
      },
      tooltip: {
        backgroundColor: '#1F2937',
        titleColor: '#F9FAFB',
        bodyColor: '#D1D5DB',
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#9CA3AF' },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#9CA3AF', precision: 0 },
        beginAtZero: true,
      },
    },
  }

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-900 text-white">
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
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-900 text-red-400">
        <div className="text-center p-6 bg-gray-800 rounded-lg max-w-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
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
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // At this point, `data` is available. We know it always has `data.singleLink`.
  // We’ll build the **exact same UI** for both cases and just swap out which
  // fields we pull from `data`.
  // ─────────────────────────────────────────────────────────────────────────────

  // “Summary” values:
  let summaryTitle,
    summarySubtitle,
    summaryValue1Label,
    summaryValue1,
    summaryValue2Label,
    summaryValue2

  // Chart datasets:
  let topBrowsersDataConfig,
    topCountriesDataConfig,
    clicksTrendDataConfig,
    linksTableRows = []

  if (data.singleLink) {
    // ─── Single‐Link Mode ──────────────────────────────────────────────────────
    summaryTitle = `Analytics for /${data.shortCode}`
    summarySubtitle = data.originalUrl
    summaryValue1Label = 'Created'
    summaryValue1 = new Date(data.createdAt).toLocaleString()
    summaryValue2Label = 'Total Clicks'
    summaryValue2 = data.totalClicks

    topBrowsersDataConfig = {
      labels: (data.topBrowsers || []).map((b) => b._id || 'Unknown'),
      datasets: [
        {
          label: 'Clicks',
          data: (data.topBrowsers || []).map((b) => b.count),
          backgroundColor: '#3B82F6',
          borderRadius: 8,
        },
      ],
    }

    topCountriesDataConfig = {
      labels: (data.topCountries || []).map((c) => c._id || 'Unknown'),
      datasets: [
        {
          label: 'Clicks',
          data: (data.topCountries || []).map((c) => c.count),
          backgroundColor: '#10B981',
          borderRadius: 8,
        },
      ],
    }

    clicksTrendDataConfig = {
      labels: (data.clicksTrend || []).map((d) => d.date),
      datasets: [
        {
          label: 'Clicks',
          data: (data.clicksTrend || []).map((d) => d.count),
          fill: { target: 'origin', above: 'rgba(59, 130, 246, 0.1)' },
          borderColor: '#3B82F6',
          tension: 0.4,
          pointBackgroundColor: '#1D4ED8',
          pointBorderColor: '#fff',
          pointHoverRadius: 6,
          pointRadius: 4,
        },
      ],
    }

    // Only one row in the “links table”: the single link’s info
    linksTableRows = [
      {
        _id: data.shortCode,
        shortCode: data.shortCode,
        originalUrl: data.originalUrl,
        createdAt: data.createdAt,
        clickCount: data.totalClicks,
      },
    ]
  } else {
    // ─── Project‐Wide Mode ────────────────────────────────────────────────────
    summaryTitle = 'Project Analytics'
    summarySubtitle = `Project has ${data.totalLinks} link(s)`
    summaryValue1Label = 'Total Links'
    summaryValue1 = data.totalLinks
    summaryValue2Label = 'Total Clicks'
    summaryValue2 = data.totalClicks

    topBrowsersDataConfig = {
      labels: (data.topBrowsers || []).map((b) => b._id || 'Unknown'),
      datasets: [
        {
          label: 'Clicks',
          data: (data.topBrowsers || []).map((b) => b.count),
          backgroundColor: '#3B82F6',
          borderRadius: 8,
        },
      ],
    }

    topCountriesDataConfig = {
      labels: (data.topCountries || []).map((c) => c._id || 'Unknown'),
      datasets: [
        {
          label: 'Clicks',
          data: (data.topCountries || []).map((c) => c.count),
          backgroundColor: '#10B981',
          borderRadius: 8,
        },
      ],
    }

    clicksTrendDataConfig = {
      labels: (data.clicksTrend || []).map((d) => d.date),
      datasets: [
        {
          label: 'Clicks',
          data: (data.clicksTrend || []).map((d) => d.count),
          fill: { target: 'origin', above: 'rgba(59, 130, 246, 0.1)' },
          borderColor: '#3B82F6',
          tension: 0.4,
          pointBackgroundColor: '#1D4ED8',
          pointBorderColor: '#fff',
          pointHoverRadius: 6,
          pointRadius: 4,
        },
      ],
    }

    // Copy data.links → table rows
    linksTableRows = (data.links || []).map((link) => ({
      _id:       link._id,
      shortCode: link.shortCode,
      originalUrl: link.originalUrl,
      createdAt: link.createdAt,
      clickCount: link.clickCount,
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* ─────────── Summary Header ─────────── */}
        <div
          className={`bg-gray-800/50 backdrop-blur-lg rounded-xl p-5 border border-gray-700 mb-8 shadow-lg ${
            data.singleLink ? '' : ''
          }`}
        >
          <h1 className="text-xl font-semibold mb-2">{summaryTitle}</h1>
          {summarySubtitle && (
            <p className="text-gray-400 text-sm mb-1">{summarySubtitle}</p>
          )}
          <div className="flex space-x-6 mt-2">
            <div>
              <p className="text-sm text-gray-400">{summaryValue1Label}</p>
              <p className="text-2xl font-bold">{summaryValue1 ?? 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">{summaryValue2Label}</p>
              <p className="text-2xl font-bold">{summaryValue2 ?? 0}</p>
            </div>
          </div>
        </div>

        {/* ─────────── Charts ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Clicks Over Time */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-5 border border-gray-700 shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Clicks Over Time</h2>
            <div className="h-64">
              <Line data={clicksTrendDataConfig} options={chartOptions} />
            </div>
          </div>

          {/* Top Browsers */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-5 border border-gray-700 shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Top Browsers</h2>
            <div className="h-64">
              <Bar data={topBrowsersDataConfig} options={chartOptions} />
            </div>
          </div>

          {/* Top Countries */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-5 border border-gray-700 shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Top Countries</h2>
            <div className="h-64">
              <Bar data={topCountriesDataConfig} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* ─────────── Links Table ─────────── */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-5 border border-gray-700 shadow-lg">
          <h2 className="text-lg font-semibold mb-4">
            {data.singleLink ? 'This Link' : 'Top Performing Links'}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left text-gray-400 font-medium">
                    Short URL
                  </th>
                  <th className="py-3 px-4 text-left text-gray-400 font-medium">
                    Destination
                  </th>
                  <th className="py-3 px-4 text-left text-gray-400 font-medium">
                    Created
                  </th>
                  <th className="py-3 px-4 text-left text-gray-400 font-medium">
                    Clicks
                  </th>
                  <th className="py-3 px-4 text-right text-gray-400 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {linksTableRows.length > 0 ? (
                  linksTableRows.map((row) => (
                    <tr
                      key={row._id}
                      className="border-b border-gray-800 last:border-0 hover:bg-gray-800/30"
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono text-blue-400">
                          /{row.shortCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-gray-300">
                        {row.originalUrl}
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-sm">
                        {new Date(row.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">{row.clickCount}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!data.singleLink && (
                          <button
                            className="text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded-lg transition"
                            onClick={() => {
                              // If user clicks “View Details” in project-wide mode,
                              // change URL to ?shortCode=… which triggers the same component
                              // to refresh and show single-link view.
                              window.history.pushState(
                                null,
                                '',
                                `/project/${projectId}/analytics?shortCode=${row.shortCode}`
                              )
                              window.location.reload()
                            }}
                          >
                            View Details
                          </button>
                        )}
                        {data.singleLink && (
                          <span className="text-gray-500 italic">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-gray-500"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-16 w-16 mx-auto opacity-30"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="mt-4">
                        {data.singleLink
                          ? 'No data for this link.'
                          : 'No links created yet.'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
