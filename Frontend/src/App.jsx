import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import ProjectDetails from './components/ProjectDetails';
import ShortLinkPage from './components/ShortLinkPage';
import SharedFile from './pages/files/SharedFile';

// function ProjectLayout() {
//   const { projectId } = useParams();
  
//   return (
//     <div className="flex flex-1">
//       <Sidebar />
//       <main className="flex-1 overflow-auto">
//         <Outlet context={{ projectId }} />
//       </main>
//     </div>
//   );
// }

function App() {
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        {/* Shared file route - no navbar */}
        <Route path="/share/:shareId" element={<SharedFile />} />
        {/* Protected routes with navbar */}
        <Route path="/" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/project/:projectId" element={<ProjectDetails />} />   
        <Route path="/:shortCode" element={<ShortLinkPage />} /> 
      </Routes>
    </>
  );
}

export default App;


