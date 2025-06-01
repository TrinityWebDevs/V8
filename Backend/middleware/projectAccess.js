import Project from '../model/project.model.js';
import File from '../model/file.model.js';
import mongoose from 'mongoose';

export async function checkProjectAccess(req, res, next) {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not a member of this project' });
    }

    req.project = project;
    next();
  } catch (err) {
    next(err);
  }
}

export async function enforceStorageQuota(req, res, next) {
  try {
    const projectId = new mongoose.Types.ObjectId(req.params.projectId);
    const newFileSize = req.file?.size || 0;

    // Aggregate total storage used by project
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


    const usedBytes = (agg[0]?.totalUsed || 0) + newFileSize;
    const quotaBytes = parseInt(process.env.MAX_STORAGE_BYTES, 10) || 50 * 1024 * 1024;

    if (usedBytes > quotaBytes) {
      return res.status(413).json({
        message: 'Project storage quota exceeded',
        used: usedBytes,
        quota: quotaBytes
      });
    }

    next();
  } catch (err) {
    console.error('Error in enforceStorageQuota:', err);
    next(err);
  }
} 