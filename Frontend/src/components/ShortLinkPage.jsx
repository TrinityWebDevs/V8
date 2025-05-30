import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const BACKEND = 'http://localhost:3000';

export default function ShortLinkPage() {
  const { shortCode } = useParams();
  const [stage, setStage] = useState('loading');
  const [error, setError] = useState('');
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    axios.get(`${BACKEND}/project/shortlink/info/${shortCode}`, { withCredentials: true })
      .then(res => {
        if (res.data.expired) {
          setStage('expired');
        } else if (res.data.requiresPassword) {
          setStage('protected');
        } else {
          setStage('redirecting'); // show loading before redirect
          setTimeout(() => {
            window.location.href = `${BACKEND}/${shortCode}`;
          }, 100); 
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

  const submitPassword = () => {
    axios.post(
      `${BACKEND}/project/shortlink/verify-password/${shortCode}`,
      { password: pwInput },
      { withCredentials: true }
    )
    .then(res => window.location.href = res.data.redirectTo)
    .catch(err => setPwError(err.response?.data?.message || 'Incorrect password'));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      submitPassword();
    }
  };

  if (stage === 'loading' || stage === 'redirecting') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="text-white text-sm opacity-70">
            {stage === 'loading' ? 'Loading...' : 'Redirecting...'}
          </span>
        </div>
      </div>
    );
  }

  if (stage === 'notfound') return <FullPage msg="Link not found" />;
  if (stage === 'expired') return <FullPage msg="Link expired" />;
  if (stage === 'error') return <FullPage msg={`Error: ${error}`} />;

  if (stage === 'protected') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-xs space-y-6">
          <div className="text-center">
            <h1 className="text-white text-lg font-light">Enter Password</h1>
          </div>

          <div className="space-y-4">
            <input
              type="password"
              placeholder="Password"
              value={pwInput}
              onChange={e => {
                setPwInput(e.target.value);
                setPwError('');
              }}
              onKeyPress={handleKeyPress}
              className="w-full p-3 bg-black border border-gray-800 rounded text-white placeholder-gray-500 focus:border-white focus:outline-none transition-colors"
            />

            {pwError && (
              <p className="text-red-400 text-sm text-center">{pwError}</p>
            )}

            <button
              onClick={submitPassword}
              className="w-full p-3 bg-white text-black rounded font-medium hover:bg-gray-200 transition-colors"
            >
              Unlock
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null; // fallback
}

function FullPage({ msg }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white text-center">
        <p className="text-lg font-light">{msg}</p>
      </div>
    </div>
  );
}
