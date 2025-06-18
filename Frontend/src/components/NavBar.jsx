import React, { useEffect, useState } from 'react';
import { BACKEND } from '../utils/config.js';
import axios from 'axios';

export default function Navbar() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Fetch user data directly in the navbar
    axios.get(`${BACKEND}/api/user`, { withCredentials: true })
      .then(res => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  const logout = () => {
    window.open(`${BACKEND}/auth/logout`, '_self');
  };

  return (
    <nav className="bg-gray-800 shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between h-16">
          {/* Logo and app name */}
          <div className="flex items-center">
            <a href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-white">V8</span>
            </a>
          </div>
          
          {/* User Profile Section */}
          <div className="flex items-center">
            {user && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  <img 
                    src={user.photo} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full object-cover" 
                  />
                  <span className="ml-2 text-sm font-medium text-white">
                    {user.name}
                  </span>
                </div>
                <button 
                  onClick={logout}
                  className="bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-4 rounded transition duration-300"
                >
                  Logout
                </button>
              </div>
            )}
           
          </div>
        </div>
      </div>
    </nav>
  );
}