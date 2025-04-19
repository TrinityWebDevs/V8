import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ProjectManager from './Project';

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:3000/api/user', { withCredentials: true })
      .then(res => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  const logout = () => {
    window.open('http://localhost:3000/auth/logout', '_self');
  };

  if (!user) {
    return (
      <div className="text-center mt-10 text-gray-600 text-lg">
        You are not logged in. Please <a href="/" className="text-blue-500 underline">login</a>.
      </div>
    );
  }

  return (
   
          <ProjectManager/>
       
  );
}
