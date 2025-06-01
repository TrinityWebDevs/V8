import { useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useProjectFiles } from '../../hooks/useProjectFiles';
import { formatFileSize, formatDate, getFileIcon } from '../../utils/format';
import toast from 'react-hot-toast';
import { IoTrashBinOutline } from "react-icons/io5";
import { FaRegCopy } from "react-icons/fa";

export default function FileDashboard({ project, projectId }) {
  const {
    files,
    used,
    quota,
    remaining,
    loading,
    error,
    uploadFile,
    deleteFile
  } = useProjectFiles(projectId);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      try {
        await uploadFile(file);
        setUploadError(null);
      } catch (err) {
        setUploadError(err.message);
      }
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        await uploadFile(file);
        setUploadError(null);
      } catch (err) {
        setUploadError(err.message);
      }
    }
  };

  const handleDeleteClick = (file) => {
    setSelectedFile(file);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedFile) {
      try {
        await deleteFile(selectedFile._id);
        setShowDeleteModal(false);
        setSelectedFile(null);
      } catch (err) {
        setUploadError(err.message);
      }
    }
  };

  const copyToClipboard = (shareId) => {
    const link = `${window.location.origin}/share/${shareId}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-black min-h-screen">
      {error && (
        <div className="bg-red-900 border border-red-800 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Storage Usage Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-white">
            Used {formatFileSize(used)} / {formatFileSize(quota)}
          </span>
          <span className="text-sm text-gray-400">
            {formatFileSize(remaining)} remaining
          </span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2.5">
          <div
            className="bg-white h-2.5 rounded-full"
            style={{ width: `${(used / quota) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 mb-8 text-center ${
          isDragging ? 'border-white bg-gray-900' : 'border-gray-800'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-white text-black px-4 py-2 rounded font-medium hover:bg-gray-200 transition-colors"
        >
          Choose File
        </button>
        <p className="mt-2 text-gray-400">or drag and drop</p>
        {uploadError && (
          <p className="mt-2 text-red-400 text-sm">{uploadError}</p>
        )}
      </div>

      {/* Files Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-800">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                File
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Size
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Upload Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Downloads
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-black divide-y divide-gray-800">
            {files.map((file) => (
              <tr key={file._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="mr-2 text-white">{getFileIcon(file.mimeType)}</span>
                    <span className="text-sm font-medium text-white">
                      {file.originalName}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {formatFileSize(file.size)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {formatDate(file.uploadDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {file.downloadCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => copyToClipboard(file.shareId)}
                    className="text-white text-[20px] hover:text-gray-300 mr-4 transition-colors"
                  >
                    <FaRegCopy />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(file)}
                    className="text-red-400 text-[20px] hover:text-red-300 transition-colors"
                  >
                    <IoTrashBinOutline />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <h3 className="text-lg font-medium mb-4 text-white">Confirm Delete</h3>
            <p className="mb-4 text-gray-300">
              Are you sure you want to delete {selectedFile?.originalName}?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 