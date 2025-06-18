import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL;

export const fileService = {
  async getProjectFiles(projectId) {
    try {
      const response = await axios.get(
        `${API_URL}/file/${projectId}`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch files');
      }
      throw new Error('Network error while fetching files');
    }
  },

  async uploadFile(projectId, file) {
    // Check file size
    if (file.size > 50 * 1024 * 1024) { // 50MB
      throw new Error('File size exceeds 50MB limit');
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(
        `${API_URL}/file/${projectId}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true
        }
      );
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Upload failed');
      }
      throw new Error('Network error during upload');
    }
  },

  async deleteFile(projectId, fileId) {
    try {
      const response = await axios.delete(
        `${API_URL}/file/${projectId}/${fileId}`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to delete file');
      }
      throw new Error('Network error while deleting file');
    }
  },

  async getSharedFile(shareId) {
    const response = await axios.get(`${API_URL}/file/share/${shareId}`);
    return response.data;
  }
}; 