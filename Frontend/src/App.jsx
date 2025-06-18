import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { BACKEND } from './utils/config.js';
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

// Helper component performs one-time auth status fetch using /api/user.
const AuthWrapper = ({ children, fallback }) => {
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;
    axios
      .get(`${BACKEND}/api/user`, { withCredentials: true })
      .then(() => {
        if (mounted) {
          setAuthenticated(true);
          setAuthChecked(true);
        }
      })
      .catch(() => {
        if (mounted) {
          setAuthenticated(false);
          setAuthChecked(true);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (!authChecked) return null; // or a spinner
  return children(authenticated);
};

// Route components relying on AuthWrapper
// NOTE: This assumes that the backend sets at least one cookie (e.g. the session cookie)
// once a user successfully signs in. If you use a specific cookie name (e.g. "token"),
// modify the check accordingly.
// ----- removed cookie-based check; using API call instead -----

// Route wrapper: only render children if NOT authenticated. Otherwise, redirect to the
// default authenticated landing page ("/dashboard").
const PublicRoute = ({ children }) => {
  return (
    <AuthWrapper fallback={<Navigate to="/dashboard" replace />}> 
      {(authenticated) => (authenticated ? <Navigate to="/dashboard" replace /> : children)}
    </AuthWrapper>
  );
};

// Route wrapper: only render children if authenticated. Otherwise, redirect to "/".
const PrivateRoute = ({ children }) => {
  return (
    <AuthWrapper>
      {(authenticated) => (authenticated ? children : <Navigate to="/" replace />)}
    </AuthWrapper>
  );
};

function App() {
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        {/* Public route (login). Block when already signed in */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Auth />
            </PublicRoute>
          }
        />

        {/* All authenticated-only routes */}
        <Route
          path="/share/:shareId"
          element={
            <PrivateRoute>
              <SharedFile />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/project/:projectId"
          element={
            <PrivateRoute>
              <ProjectDetails />
            </PrivateRoute>
          }
        />
        <Route
          path="/:shortCode"
          element={
            <PrivateRoute>
              <ShortLinkPage />
            </PrivateRoute>
          }
        />

        {/* Catch-all redirect handled with AuthWrapper */}
        <Route
          path="*"
          element={
            <AuthWrapper>
              {(authenticated) => (
                <Navigate to={authenticated ? "/dashboard" : "/"} replace />
              )}
            </AuthWrapper>
          }
        />
      </Routes>
    </>
  );
}

export default App;


