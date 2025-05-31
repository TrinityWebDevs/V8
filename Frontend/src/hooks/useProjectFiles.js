import { useState, useEffect, useCallback } from 'react';
import { fileService } from '../utils/fileService';

export function useProjectFiles(projectId) {
  const [files, setFiles] = useState([]);
  const [used, setUsed] = useState(0);
  const [quota, setQuota] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  console.log(projectId);
  
  const fetchFiles = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await fileService.getProjectFiles(projectId);
      setFiles(data.files);
      setUsed(data.used);
      setQuota(data.quota);
      setRemaining(data.remaining);
    } catch (err) {
      setError(err.message || 'Failed to fetch files');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const uploadFile = async (file) => {
    try {
      setError(null);
      await fileService.uploadFile(projectId, file);
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchFiles();
    } catch (err) {
      setError(err.message || 'Failed to upload file');
      throw err;
    }
  };

  const deleteFile = async (fileId) => {
    try {
      setError(null);
      await fileService.deleteFile(projectId, fileId);
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchFiles();
    } catch (err) {
      setError(err.message || 'Failed to delete file');
      throw err;
    }
  };

  return {
    files,
    used,
    quota,
    remaining,
    loading,
    error,
    refresh: fetchFiles,
    uploadFile,
    deleteFile
  };
} 