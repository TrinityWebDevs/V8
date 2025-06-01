import { nanoid } from 'nanoid';
import File from '../model/file.model.js';
import { uploadToCloudinary } from '../middleware/upload.js';
import cloudinary from '../config/cloudinary.js';
import axios from 'axios';
import mongoose from 'mongoose';

export async function uploadFile(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    // Check file size
    if (req.file.size > 50 * 1024 * 1024) { // 50MB
      return res.status(400).json({ message: 'File size exceeds 50MB limit' });
    }

    // upload buffer → Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);

    const file = await File.create({
      project:      req.params.projectId,
      originalName: req.file.originalname,
      mimeType:     req.file.mimetype,
      size:         req.file.size,
      url:          result.secure_url,
      public_id:    result.public_id,
      shareId:      nanoid(10)
    });

    res.json({
      message: 'File uploaded',
      link:    `${process.env.LINK_BASE_URL}/share/${file.shareId}`
    });
  } catch (err) {
    next(err);
  }
}

export async function listProjectFiles(req, res, next) {
  try {
    const files = await File.find({ project: req.params.projectId })
                          .select('-__v -project')
                          .sort('-uploadDate');

    // Convert string ID to ObjectId for proper comparison
    const projectId = new mongoose.Types.ObjectId(req.params.projectId);

    // Debug: Log the aggregation pipeline
    const agg = await File.aggregate([
      { 
        $match: { 
          project: projectId 
        } 
      },
      { 
        $group: { 
          _id: null, 
          totalUsed: { $sum: '$size' },
          count: { $sum: 1 }  // Add count to verify if any documents match
        } 
      }
    ]);
    const usedBytes = (agg[0] && agg[0].totalUsed) || 0;

    // 3️⃣ Read quota from env
    const quotaBytes = parseInt(process.env.MAX_STORAGE_BYTES, 10) || 50 * 1024 * 1024;

    // 4️⃣ Send back files + usage info
    return res.json({
      quota:     quotaBytes,      // in bytes
      used:      usedBytes,       // in bytes
      remaining: quotaBytes - usedBytes,
      files
    });
  } catch (err) {
    console.error('Error in listProjectFiles:', err);
    next(err);
  }
}

export async function getFileByShareId(req, res, next) {
  try {
    const file = await File.findOne({ shareId: req.params.shareId });
    if (!file) return res.status(404).json({ message: 'File not found' });

    // increment counter
    file.downloadCount++;
    await file.save();

    // Set appropriate headers for file download
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    
    // Redirect to the Cloudinary URL with download parameter
    const downloadUrl = `${file.url}?attachment=true`;
    return res.redirect(downloadUrl);
  } catch (err) {
    console.error('Error in getFileByShareId:', err);
    next(err);
  }
}

export async function deleteFile(req, res, next) {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'Not found' });
    
    // Verify file belongs to project
    if (file.project.toString() !== req.params.projectId) {
      return res.status(403).json({ message: 'File does not belong to this project' });
    }

    // delete from Cloudinary
    await cloudinary.uploader.destroy(file.public_id);

    // delete DB record
    await File.findByIdAndDelete(req.params.id);
    res.json({ message: 'File deleted' });
  } catch (err) {
    next(err);
  }
}
