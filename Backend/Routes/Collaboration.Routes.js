import express from "express";
import mongoose from "mongoose";

import Project from "../model/project.model.js";
import User from "../model/user.js"; // Ensure you have a User model imported
import shortLink from "../model/shortLink.model.js";
import ChatMessage from "../model/ChatMessage.model.js";

const router = express.Router();

router.post("/new-project", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not Authenticated" });
    }
    const { name,description} = req.body;

    const user = req.user;
    const alreadyTaken = await Project.findOne({ name });
    if (alreadyTaken) {
      return res.status(400).json({ message: "Project name already taken" });
    }
    const newProject = await Project.create({
      name,
      description,
      members: [user._id],
    });

    res.status(201).json({
      message: "Project created successfully",
      project: newProject,
    });
  } catch (err) {
    console.error("Error creating project:", err);
    res.status(500).json({ message: "Failed to create project" });
  }
});

router.post("/add-members", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not Authenticated" });
    }

    const { projectName, userIds } = req.body;

    if (!projectName || !Array.isArray(userIds)) {
      return res.status(400).json({ message: "Invalid data format" });
    }

    const user = req.user;

    const project = await Project.findOne({ name: projectName });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if current user is a member
    if (!project.members.includes(user._id)) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this project" });
    }

    // Filter out IDs that are already members
    const newMembers = userIds.filter(
      (id) => !project.members.map(String).includes(id)
    );

    // Add new unique members
    project.members.push(...newMembers);
    await project.save();

    res.status(200).json({
      message: "✅ Members added successfully",
      project,
    });
  } catch (err) {
    console.error("Error adding members:", err);
    res.status(500).json({ message: "❌ Failed to add members" });
  }
});

router.get("/my-projects", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not Authenticated" });
    }

    const user = req.user;

    const projects = await Project.find({ members: user._id });

    res.status(200).json({
      projects,
    });
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
});

router.post("/search-users", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not Authenticated" });
    }

    const { namePrefix } = req.body;

    if (!namePrefix || typeof namePrefix !== "string") {
      return res.status(400).json({ message: "Invalid name prefix" });
    }

    // Find users whose names start with the given prefix (case-insensitive)
    let users = await User.find({
      name: { $regex: `^${namePrefix}`, $options: "i" },
    }).select("name email"); // Select only necessary fields
    users=users.filter(obj=>obj.email!=req.user.email)
    res.status(200).json({
      message: "✅ Users fetched successfully",
      users,
    });
  } catch (err) {
    console.error("Error searching users:", err);
    res.status(500).json({ message: "❌ Failed to search users" });
  }
});

// New route to fetch member details by user ID
router.post("/get-member-details", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not Authenticated" });
    }

    const { userId } = req.body;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Find the user by ID
    const user = await User.findById(userId).select("name photo");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "✅ Member details fetched successfully",
      user,
    });
  } catch (err) {
    console.error("Error fetching member details:", err);
    res.status(500).json({ message: "❌ Failed to fetch member details" });
  }
});


router.get("/get-project/:projectId", async (req, res) => {
  try {
      if(req.isAuthenticated()===false){
          return res.status(401).json({ message: "Not Authenticated" });
      }

      const { projectId } = req.params;

      const project = await Project.findById(projectId).populate("members", "name email photo");
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

       // Check if user is a member
      if (!project.members.some(member => member._id.equals(req.user._id))) {
        return res.status(403).json({ message: "You are not authorized to view this project" });
      }

      const shortLinks = await shortLink.find({ project: projectId });

      res.status(200).json({
        project,
        shortLinks,
      });

  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ message: "Failed to fetch project" });
  }
})

// Route to get chat history for a project
router.get("/chat-history/:projectId", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not Authenticated" });
    }

    const { projectId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid project ID format" });
    }

    // Verify project existence and user membership
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!project.members.map(memberId => memberId.toString()).includes(userId.toString())) {
      return res.status(403).json({ message: "You are not a member of this project and cannot view its chat history." });
    }

    const messages = await ChatMessage.find({ project: projectId })
      .populate("user", "name photo") // Populate user's name and photo
      .sort({ timestamp: 1 }); // Sort by oldest first

    res.status(200).json({
      message: "✅ Chat history fetched successfully",
      chatHistory: messages,
    });

  } catch (err) {
    console.error("Error fetching chat history:", err);
    res.status(500).json({ message: "❌ Failed to fetch chat history" });
  }
});

export default router;
