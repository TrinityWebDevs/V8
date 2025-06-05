import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project", // Assuming your project model is named 'Project'
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Assuming your user model is named 'User'
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  reactions: {
    type: Map,
    of: [mongoose.Schema.Types.ObjectId],
    ref: "User",
    default: {},
  },
  // Ensure timestamps are indexed if you query by them frequently for sorting
  // timestamp: { type: Date, default: Date.now, index: true },
});

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

export default ChatMessage;
