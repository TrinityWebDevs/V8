import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function SharedFile() {
  const { shareId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFile = async () => {
      try {
        // Make a HEAD request first to check if file exists
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/file/share/${shareId}`);
        console.log(response , "response" );
        
        // If file exists, redirect to the download URL
        window.location.href = `${import.meta.env.VITE_BACKEND_URL}/file/share/${shareId}`;
      } catch (err) {
        console.error('Error accessing file:', err);
        setError('File not found or access denied');
        setLoading(false);
      }
    };

    fetchFile();
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return null;
} 