import File from '../models/File.js';

const MAX_STORAGE_BYTES = 50 * 1024 * 1024; // 50 MB

export async function enforceStorageQuota(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    // Sum up sizes of all files this user has already stored
    const agg = await File.aggregate([
      { $match: { user: req.user.id } },
      { $group: { _id: null, total: { $sum: '$size' } } }
    ]);

    const used = (agg[0] && agg[0].total) || 0;
    const incoming = req.file.size;

    if (used + incoming > MAX_STORAGE_BYTES) {
      const usedMB = (used / (1024*1024)).toFixed(2);
      const incomingMB = (incoming / (1024*1024)).toFixed(2);
      return res.status(403).json({
        message: `Storage quota exceeded. You have used ${usedMB} MB; `
               + `uploading this file (${incomingMB} MB) would go over 50 MB.`
      });
    }

    next();
  } catch (err) {
    next(err);
  }
}
