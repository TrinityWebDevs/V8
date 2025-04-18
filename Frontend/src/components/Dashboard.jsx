import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:3000/api/user', { withCredentials: true })
      .then(res => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  const logout = () => {
    window.open('http://localhost:3000/logout', '_self');
  };

  if (!user) {
    return (
      <div className="text-center mt-10 text-gray-600 text-lg">
        You are not logged in. Please <a href="/" className="text-blue-500 underline">login</a>.
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100 font-sans">
      <div className="bg-white p-6 rounded-lg shadow-md w-72 text-center">
        <div className="flex flex-col items-center justify-center">
          <h2 className="text-xl text-gray-800 mb-4">Welcome, {user.name}!</h2>
          <img src={user.photo} alt="profile" className="rounded-full w-24 h-24 object-cover mb-6" />
          <button 
            onClick={logout} 
            className="bg-red-500 text-white py-2 px-6 rounded-md text-lg transition-colors duration-300 hover:bg-red-400"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
