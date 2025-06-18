import mongoose from 'mongoose';
const { Schema } = mongoose;

// Schema for logging each status check
const statusCheckSchema = new Schema({
  monitor: {
    type: Schema.Types.ObjectId,
    ref: 'Monitor',
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['Up', 'Down'],
    required: true,
  },
  responseTime: { // in milliseconds
    type: Number,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  error: { 
    type: String 
  }, 
  aiAnalysis: { 
    type: String 
  },
});

// Schema for the monitor itself
const monitorSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  url: {
    type: String,
    required: true,
    trim: true,
  },
  protocol: {
      type: String,
      enum: ['http', 'https', 'tcp'],
      default: 'https',
  },
  interval: { // in seconds
    type: Number,
    default: 300, // Default to checking every 5 minutes
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isPaused: {
    type: Boolean,
    default: false,
  },
  lastChecked: {
    type: Date,
  },
  latestStatus: {
    type: String,
    enum: ['Up', 'Down', 'Pending', null],
    default: 'Pending',
  }
}, { timestamps: true });

const Monitor = mongoose.model('Monitor', monitorSchema);
const StatusCheck = mongoose.model('StatusCheck', statusCheckSchema);

export { Monitor, StatusCheck };
