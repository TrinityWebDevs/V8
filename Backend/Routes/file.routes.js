// routes/fileRoutes.js
import express from 'express';
import { upload } from '../middleware/upload.js';
import { enforceStorageQuota, checkProjectAccess } from '../middleware/projectAccess.js';
import {
  uploadFile,
  listProjectFiles,
  getFileByShareId,
  deleteFile
} from '../controllers/file.controller.js';
import protectRoutes from '../middleware/protectRoutes.js';

const router = express.Router();

// Public share route - must be before protected routes
router.get('/share/:shareId', getFileByShareId);

// Project-scoped routes
router.post(
  '/:projectId/upload',
  protectRoutes,
  checkProjectAccess,
  upload,               // multer → req.file
  enforceStorageQuota,  // check total ≤ 50 MB
  uploadFile
);

router.get('/:projectId', protectRoutes, checkProjectAccess, listProjectFiles);
router.delete('/:projectId/:id', protectRoutes, checkProjectAccess, deleteFile);

export default router;
