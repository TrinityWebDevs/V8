import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import FileDashboard from './components/FileDashboard';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import SharedFile from './components/SharedFile';

function ProjectLayout() {
  const { projectId } = useParams();
  
  return (
    <div className="flex flex-1">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet context={{ projectId }} />
      </main>
    </div>
  );
}

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* Shared file route - no navbar */}
        <Route path="/share/:shareId" element={<SharedFile />} />
        {/* Protected routes with navbar */}
        <Route path="/" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/project/:projectId" element={<ProjectLayout />}>
          <Route path="ai" element={<div>Built with AI Content</div>} />
          <Route path="links" element={<div>Links Content</div>} />
          <Route path="files" element={<FileDashboard />} />
          <Route path="monitor" element={<div>Monitor Content</div>} />
        </Route>
      </Routes>
    </>
  );
}

export default App;


