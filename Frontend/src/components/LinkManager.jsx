import React, { useEffect, useState } from 'react';
import axios from 'axios';

const domains = ['localhost:5173'];

const generateRandomCode = () => {
  return Math.random().toString(36).substring(2, 8);
};

const LinkManager = ({ projectId }) => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(domains[0]);
  const [customCode, setCustomCode] = useState('');
  const [comments, setComments] = useState('');
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchLinks = async () => {
    try {
      const res = await axios.get(`/api/project/get-project/${projectId}`);
      setLinks(res.data.shortLinks || []);
    } catch (err) {
      console.error("Error fetching links:", err);
    }
  };

  useEffect(() => {
    if (projectId) fetchLinks();
  }, [projectId]);

  const isCodeUnique = (code) => {
    return !links.some(link => link.shortCode === code);
  };

  const handleGenerateRandomCode = () => {
    let code;
    do {
      code = generateRandomCode();
    } while (!isCodeUnique(code));
    setCustomCode(code);
  };

  const handleCreateLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/shortlink/create', {
        projectId,
        originalUrl,
        customCode: customCode.trim() || null,
        domain: selectedDomain,
        comments: comments.trim() || null,
      });
      setOriginalUrl('');
      setCustomCode('');
      setComments('');
      setShowModal(false);
      fetchLinks();
    } catch (err) {
      console.error('Error creating link:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          + Create Link
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-md shadow-md w-full max-w-lg relative space-y-6">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-3 text-gray-400 hover:text-white text-xl"
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-semibold mb-4">New link</h2>
            <form onSubmit={handleCreateLink} className="space-y-4">

              <div>
                <label className="block mb-1 font-medium">Destination URL</label>
                <input
                  type="url"
                  required
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Short Link</label>
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    className="border bg-gray-900 rounded px-3 py-2"
                  >
                    {domains.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    placeholder="Custom code"
                    className="flex-grow p-2 border rounded"
                  />

                  <button
                    type="button"
                    onClick={handleGenerateRandomCode}
                    className="bg-gray-700 px-3 py-2 rounded hover:bg-gray-300"
                    title="Generate random code"
                  >
                    ↻
                  </button>
                </div>
              </div>

              <div>
                <label className="block mb-1 font-medium">Comments</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add comments about this link"
                  className="w-full p-2 border rounded resize-none"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
              >
                {loading ? 'Creating...' : 'Create link'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-2">Existing Links</h3>
        {links.length === 0 ? (
          <p className="text-gray-500">No links yet.</p>
        ) : (
          <ul className="space-y-2">
            {links.map((link) => (
              <li
                key={link._id}
                className="flex justify-between items-center p-3 bg-gray-100 rounded"
              >
                <div>
                  <a
                    href={link.originalUrl}
                    className="text-blue-600 underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {link.originalUrl}
                  </a>
                  <p className="text-sm text-gray-600">
                    Short Code: {link.shortCode}
                  </p>
                  {link.comments && <p className="text-xs text-gray-500 italic">"{link.comments}"</p>}
                </div>
                <span className="text-sm text-gray-500">
                  Clicks: {link.clickCount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default LinkManager;
