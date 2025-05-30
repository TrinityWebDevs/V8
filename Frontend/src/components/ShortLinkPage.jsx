import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const BACKEND = 'http://localhost:3000';

export default function ShortLinkPage() {
  const { shortCode } = useParams();
  const [stage, setStage] = useState('loading'); // loading, public, protected, expired, notfound
  const [error, setError] = useState('');
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    // 1) fetch metadata
    axios.get(`${BACKEND}/project/shortlink/info/${shortCode}`, { withCredentials: true })
      .then(res => {
        if (res.data.expired) {
          setStage('expired');
        } else if (res.data.requiresPassword) {
          setStage('protected');
        } else {
          setStage('public');
          // 2) public: navigate → backend GET /:shortCode will redirect
          window.location.href = `${BACKEND}/${shortCode}`;
        }
      })
      .catch(err => {
        if (err.response?.status === 404) {
          setStage('notfound');
        } else {
          setStage('error');
          setError(err.response?.data?.message || 'Unknown error');
        }
      });
  }, [shortCode]);

  // handle password submit
  const submitPassword = () => {
    axios.post(
      `${BACKEND}/project/shortlink/verify-password/${shortCode}`,
      { password: pwInput },
      { withCredentials: true }
    )
    .then(res => {
      window.location.href = res.data.redirectTo;
    })
    .catch(err => {
      setPwError(err.response?.data?.message || 'Incorrect password');
    });
  };

  // render by stage
  if (stage === 'loading') {
    return <FullPage message="Loading…" />;
  }
  if (stage === 'notfound') {
    return <FullPage message="Link not found." />;
  }
  if (stage === 'expired') {
    return <FullPage message="This link has expired." />;
  }
  if (stage === 'error') {
    return <FullPage message={`Error: ${error}`} />;
  }
  // protected:
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Password Required</h1>
        <p className="text-gray-400">{shortCode}</p>
        <input
          type="password"
          placeholder="Enter password"
          value={pwInput}
          onChange={e => { setPwInput(e.target.value); setPwError(''); }}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
        />
        {pwError && <p className="text-red-500">{pwError}</p>}
        <button
          onClick={submitPassword}
          className="w-full bg-indigo-600 hover:bg-indigo-700 p-2 rounded"
        >
          Unlock
        </button>
      </div>
    </div>
  );
}

function FullPage({ message }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center text-xl">
      {message}
    </div>
  );
}
