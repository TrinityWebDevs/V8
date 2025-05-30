import { useEffect, useState } from 'react';
import axios from 'axios';
import { Route, Routes } from 'react-router-dom';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import ProjectDetails from './components/ProjectDetails';
import ShortLinkPage from './components/ShortLinkPage';
import { Toaster } from 'react-hot-toast';
axios.defaults.withCredentials = true;

function App() {
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
   <Routes>
      <Route path="/" element={<Auth />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/project/:projectId" element={<ProjectDetails />} />   
      <Route path="/:shortCode" element={<ShortLinkPage />} /> 

    </Routes>
    </>
    
  );
}

export default App;


