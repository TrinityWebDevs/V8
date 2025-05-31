// src/pages/LinkManager.jsx
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'
import {
  CheckSquare,
  Copy,
  Trash2,
  BarChart2,
} from 'lucide-react'

const BACKEND = 'http://localhost:3000'
const domains = [window.location.host]

const generateRandomCode = () => Math.random().toString(36).substring(2, 8)

export default function LinkManager({
  project,
  shortLinks,
  setShortLinks,
  onViewAnalytics,
}) {
  const projectId = project._id

  const [links, setLinks] = useState([])
  const [loadingCreate, setLoadingCreate] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [copiedCode, setCopiedCode] = useState(null)

  // Form state
  const [originalUrl, setOriginalUrl] = useState('')
  const [selectedDomain, setSelectedDomain] = useState(domains[0])
  const [customCode, setCustomCode] = useState('')
  const [comments, setComments] = useState('')
  const [password, setPassword] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  // Fetch links on mount / project change
  useEffect(() => {
    axios
      .get(`${BACKEND}/project/get-project/${projectId}`, { withCredentials: true })
      .then((res) => {
        setLinks(res.data.shortLinks || [])
      })
      .catch(console.error)
  }, [projectId])

  // Create new link
  const handleCreate = async (e) => {
    e.preventDefault()
    setLoadingCreate(true)
    try {
      await axios.post(
        `${BACKEND}/project/shortlink/create`,
        {
          projectId,
          originalUrl,
          customCode: customCode.trim() || null,
          domain: selectedDomain,
          comments: comments.trim() || null,
          password: password.trim() || null,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        },
        { withCredentials: true }
      )
      toast.success('Link created successfully!')

      // reset form
      setOriginalUrl('')
      setCustomCode('')
      setComments('')
      setPassword('')
      setExpiresAt('')
      setShowCreateModal(false)

      // re‐fetch links
      const res = await axios.get(
        `${BACKEND}/project/get-project/${projectId}`,
        { withCredentials: true }
      )
      setLinks(res.data.shortLinks || [])
      if (setShortLinks) {
        setShortLinks(res.data.shortLinks || [])
      }
    } catch (err) {
      console.error(err)
      if (err.response?.status === 409 && err.response.data?.message) {
        toast.error(err.response.data.message)
      } else {
        toast.error('Failed to create link.')
      }
    } finally {
      setLoadingCreate(false)
    }
  }

  // Delete link
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this link?')) return
    try {
      await axios.delete(
        `${BACKEND}/project/shortlink/delete/${id}`,
        { withCredentials: true }
      )
      const updated = links.filter((l) => l._id !== id)
      setLinks(updated)
      if (setShortLinks) {
        setShortLinks(updated)
      }
      toast.success('Link deleted')
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete')
    }
  }

  // Open the short link URL directly (public redirect)
  const handleClick = (link) => {
    const url = `http://${link.domain}/${link.shortCode}`
    window.location.href = url
  }

  // Tell parent “show analytics for this code”
  const viewAnalytics = (link) => {
    if (onViewAnalytics) {
      onViewAnalytics(link.shortCode)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Short Links</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-lg shadow-lg transition"
        >
          + Create Link
        </button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md space-y-4 relative shadow-xl">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
            <h2 className="text-2xl font-semibold">New Link</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="url"
                required
                placeholder="Original URL"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {domains.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Custom code (optional)"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    let c
                    do {
                      c = generateRandomCode()
                    } while (links.some((l) => l.shortCode === c))
                    setCustomCode(c)
                  }}
                  className="px-3 rounded bg-gray-600 hover:bg-gray-500 transition"
                >
                  ↻
                </button>
              </div>
              <textarea
                placeholder="Comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
              />
              <input
                type="password"
                placeholder="Password (optional)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min={new Date().toISOString().slice(0, 16)}
              />
              <button
                type="submit"
                disabled={loadingCreate}
                className="w-full bg-indigo-600 hover:bg-indigo-700 py-2 rounded-lg shadow transition disabled:opacity-50"
              >
                {loadingCreate ? 'Creating…' : 'Create Link'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Links List */}
      <ul className="space-y-4">
        {links.map((link) => (
          <li
            key={link._id}
            className="bg-gray-800 p-4 rounded-lg flex justify-between items-start shadow-md hover:bg-gray-800/75 transition"
          >
            <div className="flex flex-col w-2/3">
              <p className="font-medium text-white truncate">{link.originalUrl}</p>
              <div className="mt-2 flex items-center space-x-2">
                <span className="text-indigo-400 font-semibold">{link.domain}</span>
                <span className="text-white">/</span>
                <span
                  onClick={() => handleClick(link)}
                  className="text-indigo-400 font-mono underline cursor-pointer"
                >
                  {link.shortCode}
                </span>
                <button
                  onClick={() => {
                    const shortUrl = `http://${link.domain}/${link.shortCode}`
                    navigator.clipboard.writeText(shortUrl)
                    setCopiedCode(link._id)
                    toast.success('Link copied!')
                    setTimeout(() => setCopiedCode(null), 1500)
                  }}
                  title="Copy link"
                  className="text-gray-400 hover:text-white transition"
                >
                  {copiedCode === link._id ? (
                    <CheckSquare size={18} className="text-green-400" />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>
              </div>
              {link.comments && (
                <p className="text-gray-400 italic mt-2">{link.comments}</p>
              )}
              {link.expiresAt && (
                <p className="text-xs text-gray-500 mt-1">
                  Expires: {new Date(link.expiresAt).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end space-y-3">
              <span className="text-gray-400">Clicks: {link.clickCount}</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDelete(link._id)}
                  className="p-2 rounded-full bg-gray-700 hover:bg-red-600 transition"
                  title="Delete link"
                >
                  <Trash2 size={18} className="text-red-500 hover:text-white" />
                </button>
                <button
                  onClick={() => viewAnalytics(link)}
                  className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md shadow transition"
                >
                  <BarChart2 size={16} className="text-white" />
                  <span className="text-white text-sm">Analytics</span>
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
