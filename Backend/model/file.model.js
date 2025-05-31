import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  project:       { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  originalName:  { type: String, required: true },
  mimeType:      { type: String, required: true },
  size:          { type: Number, required: true },
  url:           { type: String, required: true },
  public_id:     { type: String, required: true },
  shareId:       { type: String, required: true, unique: true },
  uploadDate:    { type: Date, default: Date.now },
  downloadCount: { type: Number, default: 0 }
});
                
export default mongoose.model('File', fileSchema);
