import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Navbar() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Fetch user data directly in the navbar
    axios.get('http://localhost:3000/api/user', { withCredentials: true })
      .then(res => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  const logout = () => {
    window.open('http://localhost:3000/auth/logout', '_self');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between h-16">
          {/* Logo and app name */}
          <div className="flex items-center">
            <a href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-gray-800">R8</span>
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
                    className="w-8 h-8 rounded-full object-cover border border-gray-200" 
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    {user.name}
                  </span>
                </div>
                <button 
                  onClick={logout}
                  className="bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-3 rounded transition duration-300"
                >
                  Logout
                </button>
              </div>
            )}
            {!user && (
              <a 
                href="/" 
                className="bg-blue-500 hover:bg-blue-600 text-white text-sm py-1 px-4 rounded transition duration-300"
              >
                Login
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}