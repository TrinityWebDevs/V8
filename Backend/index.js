import 'dotenv/config';
import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import { createClient } from "redis";
import { RedisStore } from "connect-redis";
import passport from "passport";
import cookieParser from "cookie-parser";
import cors from "cors";
import './utils/scheduler.js';
import dotenv from "dotenv";
import authRouter from "./Routes/Auth.Routes.js";
import "./auth/google.js";
import http from "http";
import { Server } from "socket.io";
import ChatMessage from "./model/ChatMessage.model.js";
import User from "./model/user.js";
import { getGeminiResponse } from "./services/geminiService.js";
import projectRouter from "./Routes/Collaboration.Routes.js";
import ShortLinkRouter from "./Routes/link.routes.js";
import redirectRouter from "./Routes/redirect.routes.js";
import AnalyticsRouter from "./Routes/Analytics.routes.js";
import taskRouter from './Routes/tasks.routes.js';
import fileRouter from "./Routes/file.routes.js";
import noteRoutes from "./Routes/note.routes.js";
import monitorRoutes from './Routes/monitor.routes.js';
import {Monitor} from './model/monitor.js';
import { URL } from 'url';
import { spawn } from 'child_process';
dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const projectOnlineUsers = {};
const projectAIChatHistories = {};

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
  },
});

global.io = io;

io.on("connection", (socket) => {
  console.log("✅ User connected to Socket.IO:", socket.id);

  const getOnlineUserIdsForProject = (projectId) => {
    if (!projectOnlineUsers[projectId]) return [];
    return [...new Set(Object.values(projectOnlineUsers[projectId]))];
  };

  socket.on("joinProjectRoom", (data) => {
    console.log("Backend joinProjectRoom RAW DATA:", data);
    const { projectId, userId } = data;

    console.log(
      "Backend joinProjectRoom DESTRUCTURED projectId:",
      projectId,
      "(type:",
      typeof projectId,
      ")"
    );
    console.log(
      "Backend joinProjectRoom DESTRUCTURED userId:",
      userId,
      "(type:",
      typeof userId,
      ")"
    );

    if (!projectId || !userId) {
      console.error(
        "Error: projectId or userId is undefined/null after destructuring",
        { projectId, userId }
      );
      return;
    }

    const finalProjectId = String(projectId._id || projectId);
    console.log(
      "Backend joinProjectRoom finalProjectId:",
      finalProjectId,
      "(type:",
      typeof finalProjectId,
      ")"
    );

    const roomName = `project-${finalProjectId}`;
    socket.join(roomName);
    socket.currentProjectId = finalProjectId;
    socket.currentUserId = userId;

    if (!projectOnlineUsers[finalProjectId]) {
      projectOnlineUsers[finalProjectId] = {};
    }
    projectOnlineUsers[finalProjectId][socket.id] = userId;

    console.log(`User ${userId} (${socket.id}) joined room: ${roomName}`);
    const onlineIds = getOnlineUserIdsForProject(finalProjectId);
    io.to(roomName).emit("updateOnlineUsers", {
      projectId: finalProjectId,
      onlineUserIds: onlineIds,
    });
    console.log(
      `Emitted updateOnlineUsers for ${roomName} (projectId: ${finalProjectId}):`,
      onlineIds
    );
  });

  socket.on("sendMessage", async ({ projectId, userId, message }) => {
    console.log("Backend received sendMessage with data:", {
      projectId,
      userId,
      message,
    });
    if (
      !projectId ||
      !userId ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      console.error("Error: Missing data for sendMessage:", {
        projectId,
        userId,
        message,
      });
      return;
    }
    try {
      const user = await User.findById(userId);
      if (!user) {
        console.error(`User not found for ID: ${userId}`);
        return;
      }

      const projectIdStr = String(projectId._id || projectId);
      const roomName = `project-${projectIdStr}`;

      if (message.toLowerCase().startsWith("@ai ")) {
        const userQueryMessage = new ChatMessage({
          project: projectId,
          user: userId,
          message: message,
        });
        await userQueryMessage.save();
        const populatedUserQuery = await ChatMessage.findById(userQueryMessage._id)
          .populate("user", "name photo");
        io.to(roomName).emit("newMessage", populatedUserQuery);
        console.log(`User's AI Query from ${userId} in room ${roomName}: ${message}`);

        const prompt = message.substring(4).trim();
        console.log(`[AI Query Extraction] User ${userId} in project ${projectIdStr} asked: ${prompt}`);

        if (!prompt) {
          const emptyPromptMsg = {
            _id: new mongoose.Types.ObjectId().toString(),
            project: projectIdStr,
            user: { _id: "AI_USER_ID_PLACEHOLDER", name: "@AI", photo: null },
            message: 'The AI query was empty. Please provide a question after "@AI ".',
            timestamp: new Date(),
            isAIMessage: true,
          };
          io.to(roomName).emit("newMessage", emptyPromptMsg);
          return;
        }

        try {
          if (!projectAIChatHistories[projectIdStr]) {
            projectAIChatHistories[projectIdStr] = [];
          }
          const currentProjectHistory = projectAIChatHistories[projectIdStr];

          currentProjectHistory.push({ role: "user", parts: [{ text: prompt }] });

          if (currentProjectHistory.length > 20) {
            projectAIChatHistories[projectIdStr] = currentProjectHistory.slice(-20);
          }
          
          const aiResponseText = await getGeminiResponse(prompt, projectAIChatHistories[projectIdStr]);

          projectAIChatHistories[projectIdStr].push({ role: "model", parts: [{ text: aiResponseText }] });
          if (projectAIChatHistories[projectIdStr].length > 20) {
            projectAIChatHistories[projectIdStr] = projectAIChatHistories[projectIdStr].slice(-20);
          }

          const AI_USER_ID_FOR_DB = '000000000000000000000000';
          const aiMessage = new ChatMessage({
            project: projectId,
            user: AI_USER_ID_FOR_DB, 
            message: aiResponseText,
            isAIMessage: true,
          });
          await aiMessage.save();
          
          let populatedAiMessageFromDB = await ChatMessage.findById(aiMessage._id)
             .populate({ path: 'user', select: 'name photo', model: User, options: { lean: true } })
             .lean();

          let messageToEmit;
          if (populatedAiMessageFromDB && populatedAiMessageFromDB.user) {
              messageToEmit = populatedAiMessageFromDB;
          } else {
              const baseMessage = populatedAiMessageFromDB || aiMessage.toObject(); 
              messageToEmit = {
                  ...baseMessage,
                  user: { _id: AI_USER_ID_FOR_DB, name: "@AI", photo: null }
              };
          }
          io.to(roomName).emit("newMessage", messageToEmit);
          console.log(`[AI Response] To room ${roomName}: ${aiResponseText}`);
        } catch (geminiError) {
          console.error("[Gemini Service Error]", geminiError);
          const errorAiMsg = {
            _id: new mongoose.Types.ObjectId().toString(),
            project: projectIdStr,
            user: { _id: "AI_USER_ID", name: "@AI_Error" },
            message: "Sorry, I encountered an error trying to respond.",
            timestamp: new Date(),
            isAIMessage: true,
          };
          io.to(roomName).emit("newMessage", errorAiMsg);
        }
      } else {
        const newMessage = new ChatMessage({
          project: projectId,
          user: userId,
          message,
        });
        await newMessage.save();
        const populatedMessage = await ChatMessage.findById(
          newMessage._id
        ).populate("user", "name photo");
        
        io.to(roomName).emit("newMessage", populatedMessage);
        console.log(`Message from ${userId} in room ${roomName}: ${message}`);
      }
    } catch (error) {
      console.error("Error processing message (user or AI):", error);
      const errorMsg = {
        _id: new mongoose.Types.ObjectId().toString(),
        project: String(projectId),
        user: { _id: "AI_USER_ID", name: "@AI_Error" },
        message: `Sorry, an error occurred: ${error.message}`,
        timestamp: new Date(),
      };
      socket.emit("newMessage", errorMsg);
    }
  });

  socket.on("typing", async ({ projectId, userId, userName }) => {
    if (projectId && userId) {
      const roomName = `project-${projectId}`;
      let nameToBroadcast = userName;
      if (!nameToBroadcast) {
        try {
          const user = await User.findById(userId);
          if (user && user.name) {
            nameToBroadcast = user.name;
          } else {
            nameToBroadcast = 'Someone'; 
          }
        } catch (err) {
          nameToBroadcast = 'Someone';
        }
      }
      console.log(`[Typing Event] User ${nameToBroadcast} (${userId}) is typing in project ${projectId}`);
      socket.to(roomName).emit("userTyping", { userId, userName: nameToBroadcast, projectId });
    } else {
      console.log(
        "[Typing Event] Received typing event with missing projectId or userId:",
        { projectId, userId, userName }
      );
    }
  });

  socket.on("messageReaction", async ({ projectId, messageId, emoji, userId }) => {
    console.log("[Reaction Received]", { projectId, messageId, emoji, userId });
    if (!projectId || !messageId || !emoji || !userId) {
      console.error("[Reaction Error] Missing data:", { projectId, messageId, emoji, userId });
      return;
    }

    try {
      const projectIdStr = String(projectId._id || projectId);
      const chatMessage = await ChatMessage.findById(messageId);

      if (!chatMessage) {
        console.error(`[Reaction Error] Message not found: ${messageId}`);
        return;
      }

      if (!chatMessage.reactions || !(chatMessage.reactions instanceof Map)) {
        chatMessage.reactions = new Map();
      }

      const usersReactedWithEmoji = chatMessage.reactions.get(emoji) || [];
      const userObjectId = new mongoose.Types.ObjectId(userId);

      const userIndex = usersReactedWithEmoji.findIndex(id => id.equals(userObjectId));

      if (userIndex > -1) {
        usersReactedWithEmoji.splice(userIndex, 1);
        if (usersReactedWithEmoji.length === 0) {
          chatMessage.reactions.delete(emoji);
        } else {
          chatMessage.reactions.set(emoji, usersReactedWithEmoji);
        }
      } else {
        usersReactedWithEmoji.push(userObjectId);
        chatMessage.reactions.set(emoji, usersReactedWithEmoji);
      }

      chatMessage.markModified('reactions');
      await chatMessage.save();

      const roomName = `project-${projectIdStr}`;
      io.to(roomName).emit("updateMessageReactions", {
        messageId: chatMessage._id,
        reactions: chatMessage.reactions,
      });
      console.log(`[Reaction Update] Emitted for message ${messageId} in room ${roomName}`);

    } catch (error) {
      console.error("[Reaction Processing Error]", error);
    }
  });

  socket.on('refineMessageRequest', async ({ projectId, userId, textToRefine }) => {
    console.log('[Refine Request Received]', { projectId, userId, textToRefine });
    if (!projectId || !userId || !textToRefine) {
      console.error('[Refine Request Error] Missing data:', { projectId, userId, textToRefine });
      socket.emit('refinedMessageResponse', { error: 'Missing data for refinement request.', refinedText: textToRefine });
      return;
    }

    try {
      const refinementPrompt = `Please refine the following text to be clear, concise, and professional. Preserve the original meaning. Aim for a response around 200 words, but prioritize quality and natural language over strict word count. Original text: "${textToRefine}"`;
      
      console.log(`[Refine AI Query] User ${userId} in project ${projectId} with prompt: ${refinementPrompt}`);
      const refinedText = await getGeminiResponse(refinementPrompt);
      
      console.log(`[Refine AI Response] For user ${userId}: ${refinedText}`);
      socket.emit('refinedMessageResponse', { refinedText });

    } catch (error) {
      console.error('[Refine Processing Error]', error);
      socket.emit('refinedMessageResponse', { error: 'Error processing refinement request.', refinedText: textToRefine });
    }
  });

  socket.on('run:diagnostic', async ({ monitorId, tool }) => {
    try {
      const monitor = await Monitor.findById(monitorId);
      if (!monitor) {
        socket.emit('diagnostic:error', 'Monitor not found.');
        return;
      }

      const url = new URL(monitor.url);
      const hostname = url.hostname;

      let cmd;
      let args;

      if (tool === 'ping') {
        cmd = 'ping';
        args = ['-c', '5', hostname]; // 5 pings
      } else if (tool === 'traceroute') {
        cmd = 'traceroute';
        args = [hostname];
      } else {
        socket.emit('diagnostic:error', 'Invalid tool specified.');
        return;
      }

      const child = spawn(cmd, args);

      socket.emit('diagnostic:output', `> Running ${tool} on ${hostname}...\n`);

      child.stdout.on('data', (data) => {
        socket.emit('diagnostic:output', data.toString());
      });

      child.stderr.on('data', (data) => {
        socket.emit('diagnostic:output', `ERROR: ${data.toString()}`);
      });

      child.on('close', (code) => {
        socket.emit('diagnostic:end', `> Process exited with code ${code}\n`);
      });

    } catch (error) {
      console.error('Diagnostic error:', error);
      socket.emit('diagnostic:error', 'An internal error occurred while running the diagnostic tool.');
    }
  });

  socket.on("disconnect", () => {
    const { currentProjectId, currentUserId } = socket;
    if (currentProjectId && currentUserId) {
      const roomName = `project-${currentProjectId}`;
      if (projectOnlineUsers[currentProjectId]) {
        delete projectOnlineUsers[currentProjectId][socket.id];
        if (Object.keys(projectOnlineUsers[currentProjectId]).length === 0) {
          delete projectOnlineUsers[currentProjectId];
        }
      }
      const onlineIds = getOnlineUserIdsForProject(currentProjectId);
      io.to(roomName).emit("updateOnlineUsers", {
        projectId: currentProjectId,
        onlineUserIds: onlineIds,
      });
      console.log(
        `User ${currentUserId} (${socket.id}) disconnected from room ${roomName}. Updated online users (projectId: ${currentProjectId}):`,
        onlineIds
      );
    } else {
      console.log(
        "❌ User disconnected from Socket.IO (no project room info):",
        socket.id
      );
    }
  });
});

async function dbConnect() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Initialize Redis Client
const redisClient = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }
});

redisClient.on('error', err => console.log('Redis Client Error', err));

(async () => {
  try {
    await redisClient.connect();
    console.log('✅ Connected to Redis successfully!');
  } catch (err) {
    console.error('Could not connect to Redis:', err);
  }
})();

// Initialize store
const redisStore = new RedisStore({
  client: redisClient,
  prefix: "myapp:", // Optional: prefix for your session keys in Redis
});

app.use(
  session({
    store: redisStore,
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production', // true in production (HTTPS)
      httpOnly: true, // Mitigates XSS
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRouter);
app.use("/project", projectRouter);
app.use("/project/shortlink", ShortLinkRouter);
app.use("/analytics", AnalyticsRouter);
app.use("/api/notes", noteRoutes);
app.use('/task', taskRouter);
app.use('/api/monitors', monitorRoutes);

app.use("/", redirectRouter);
app.use("/file", fileRouter);

app.get("/api/user", (req, res) => {
  if (req.isAuthenticated()) {
    return res.json(req.user);
  }
  res.status(401).json({ message: "Not Authenticated" });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
