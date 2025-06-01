import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter, useLocation } from 'react-router-dom'
import Navbar from './components/NavBar.jsx'
function AppWithNavbar() {
  const location = useLocation();
  const isSharedFile = location.pathname.startsWith('/share/');

  return (
    <>
      {!isSharedFile && <Navbar />}
      <App />
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    {/* <Toaster
      position="top-right"
      toastOptions={{
        duration: 5000,
        style: {
          background: '#363636',
          color: '#fff',
        },
      }}
    /> */}
    <AppWithNavbar />
  </BrowserRouter>
)
