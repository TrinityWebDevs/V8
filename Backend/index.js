import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './Routes/Auth.Routes.js';
import './auth/google.js'; // passport strategy
import http from 'http'; // ✅ Import Node.js http module
import { WebSocketServer } from 'ws';
import projectRouter from './Routes/Collaboration.Routes.js'; 
import ShortLinkRouter from './Routes/link.routes.js'; 
import redirectRouter from './Routes/redirect.routes.js';




dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
export const wss = new WebSocketServer({ server });
// MongoDB connection
dbConnect();
async function dbConnect() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

// Middleware setup
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());             // Parses JSON request bodies
app.use(cookieParser());             // Parses cookies

// Session & Passport
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }         // set secure: true in production (HTTPS)
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRouter);
app.use('/project', projectRouter); 
app.use('/project/shortlink', ShortLinkRouter); 

// Redirect route for short links
app.use("/",redirectRouter);











// Protected user endpoint
app.get('/api/user', (req, res) => {
  if (req.isAuthenticated()) {
    return res.json(req.user);
  }
  res.status(401).json({ message: 'Not Authenticated' });
});

// Start server using the HTTP instance
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });


  