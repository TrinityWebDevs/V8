// src/components/LinkManager.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BACKEND = 'http://localhost:3000';
const domains = ['localhost:3000']; // your backend base domains

const generateRandomCode = () =>
  Math.random().toString(36).substring(2, 8);

const LinkManager = ({ project }) => {
  const projectId = project._id;
  const [links, setLinks] = useState([]);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [originalUrl, setOriginalUrl] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(domains[0]);
  const [customCode, setCustomCode] = useState('');
  const [comments, setComments] = useState('');
  const [password, setPassword] = useState('');        // still captured but not handled here
  const [expiresAt, setExpiresAt] = useState('');

  // Fetch links
  useEffect(() => {
    axios.get(`${BACKEND}/project/get-project/${projectId}`, { withCredentials: true })
      .then(res => setLinks(res.data.shortLinks || []))
      .catch(console.error);
  }, [projectId]);

  // Create
  const handleCreate = async e => {
    e.preventDefault();
    setLoadingCreate(true);
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
      );
      // reset form
      setOriginalUrl('');
      setCustomCode('');
      setComments('');
      setPassword('');
      setExpiresAt('');
      setShowCreateModal(false);
      // reload
      const res = await axios.get(`${BACKEND}/project/get-project/${projectId}`, { withCredentials: true });
      setLinks(res.data.shortLinks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCreate(false);
    }
  };

  // Delete
  const handleDelete = async id => {
    if (!confirm('Delete this link?')) return;
    try {
      await axios.delete(`${BACKEND}/project/shortlink/delete/${id}`, { withCredentials: true });
      setLinks(links.filter(l => l._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Click handler
  const handleClick = link => {
    const url = `http://${link.domain}/${link.shortCode}`;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Short Links</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded"
        >
          + Create Link
        </button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md space-y-4 relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >×</button>
            <h2 className="text-xl font-semibold">New Link</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="url"
                required
                placeholder="Original URL"
                value={originalUrl}
                onChange={e => setOriginalUrl(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
              />
              <select
                value={selectedDomain}
                onChange={e => setSelectedDomain(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
              >
                {domains.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Custom code (optional)"
                  value={customCode}
                  onChange={e => setCustomCode(e.target.value)}
                  className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded"
                />
                <button
                  type="button"
                  onClick={() => {
                    let c;
                    do { c = generateRandomCode(); } while (links.some(l => l.shortCode === c));
                    setCustomCode(c);
                  }}
                  className="px-3 rounded bg-gray-600 hover:bg-gray-500"
                >↻</button>
              </div>
              <textarea
                placeholder="Comments (optional)"
                value={comments}
                onChange={e => setComments(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                rows={2}
              />
              <input
                type="password"
                placeholder="Password (optional)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
              />
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                min={new Date().toISOString().slice(0,16)}
              />
              <button
                type="submit"
                disabled={loadingCreate}
                className="w-full bg-indigo-600 hover:bg-indigo-700 py-2 rounded"
              >
                {loadingCreate ? 'Creating…' : 'Create Link'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Links List */}
      <ul className="space-y-4">
        {links.map(link => (
          <li
            key={link._id}
            className="bg-gray-800 p-4 rounded-lg flex justify-between items-start"
          >
            <div>
              <p className="font-medium text-white">{link.originalUrl}</p>
              <div className="mt-1">
                <span className="text-indigo-400 font-semibold">{link.domain}</span>
                <span className="text-white">/</span>
                <span
                  onClick={() => handleClick(link)}
                  className="text-indigo-400 font-mono underline cursor-pointer"
                >
                  {link.shortCode}
                </span>
              </div>
              {link.comments && <p className="text-gray-400 italic mt-1">{link.comments}</p>}
              {link.expiresAt && (
                <p className="text-xs text-gray-500 mt-1">
                  Expires: {new Date(link.expiresAt).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end space-y-2">
              <span className="text-gray-400">Clicks: {link.clickCount}</span>
              <button
                onClick={() => handleDelete(link._id)}
                className="text-red-500 hover:text-red-700"
              >
                🗑️
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LinkManager;
