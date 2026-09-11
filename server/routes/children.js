const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Child = require("../models/Child");

// Get all children for a parent
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "parent") {
      return res.status(403).json({ error: "Access denied." });
    }
    
    const childrenRecords = await Child.find({ parentId: req.user.id }).populate("childId", "name email");
    res.json(childrenRecords);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch children" });
  }
});

// Add a child
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "parent") {
      return res.status(403).json({ error: "Access denied." });
    }

    const { childEmail } = req.body;
    const childUser = await User.findOne({ 
      email: { $regex: new RegExp(`^${childEmail.trim()}$`, 'i') }, 
      role: "child" 
    });
    
    if (!childUser) {
      return res.status(404).json({ error: "Child account not found." });
    }

    const existingChild = await Child.findOne({ parentId: req.user.id, childId: childUser._id });
    if (existingChild) {
      return res.status(400).json({ error: "Child already linked." });
    }

    const newChild = await Child.create({ parentId: req.user.id, childId: childUser._id });
    res.status(201).json(newChild);
  } catch (err) {
    console.error("Add Child Error:", err);
    res.status(500).json({ error: "Failed to add child" });
  }
});

module.exports = router;
