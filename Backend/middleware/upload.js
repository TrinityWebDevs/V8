// middleware/upload.js
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import mime from 'mime-types';

cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage with file size limits
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types
    cb(null, true);
  }
}).single('file');

// Helper to upload buffer to Cloudinary
export function uploadToCloudinary(buffer, originalName) {
  if (!originalName) {
    return Promise.reject(new Error('Original filename is required'));
  }

  const ext = originalName.split('.').pop();
  const mimeType = mime.lookup(ext);

  let resourceType = 'raw'; // default fallback
  if (mimeType?.startsWith('image/')) resourceType = 'image';
  else if (mimeType?.startsWith('video/')) resourceType = 'video';
  else if (mimeType?.startsWith('audio/')) resourceType = 'video'; // Cloudinary treats audio under 'video'

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'user_uploads',
        resource_type: resourceType,
        public_id: originalName.split('.')[0],
        format: ext,
        use_filename: true,
        unique_filename: false,
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}
