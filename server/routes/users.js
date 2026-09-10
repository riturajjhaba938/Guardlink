const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const User = require("../models/User");

// Update profile
router.put("/profile", auth, upload.single("profilePicture"), async (req, res) => {
  try {
    const { name } = req.body;
    let updateData = {};

    if (name) updateData.name = name;

    if (req.file) {
      // Create a URL path to the file
      const protocol = req.protocol;
      const host = req.get("host");
      updateData.profilePicture = `${protocol}://${host}/uploads/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updatedUser);
  } catch (err) {
    console.error("Profile Update Error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Get current profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("Fetch Profile Error:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Update push token
router.put("/push-token", auth, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Token is required" });

    await User.findByIdAndUpdate(req.user.id, { expoPushToken: token });
    res.json({ message: "Push token updated successfully" });
  } catch (err) {
    console.error("Push Token Update Error:", err);
    res.status(500).json({ error: "Failed to update push token" });
  }
});

module.exports = router;
