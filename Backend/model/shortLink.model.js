import mongoose from "mongoose";

const shortLinkSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true
  },
  originalUrl: {
    type: String,
    required: true
  },
  shortCode: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: null
  },
  clickCount: {
    type: Number,
    default: 0
  },
  password: {
    type: String,         
    default: null
  },
  comments: {
    type: String,
    default: null
  }
});

export default mongoose.model("ShortLink", shortLinkSchema);
