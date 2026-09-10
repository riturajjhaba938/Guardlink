const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Location = require("../models/Location");

// Post location (used by child app)
router.post("/", auth, async (req, res) => {
  try {
    const { latitude, longitude, speed } = req.body;
    
    const location = await Location.create({
      childId: req.user.id,
      latitude,
      longitude,
      speed: speed || 0
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("location-update", {
        childId: req.user.id,
        latitude,
        longitude,
        speed: speed || 0,
        timestamp: location.timestamp
      });
    }

    // Check if speed exceeds 60 km/h (speed from expo-location is in m/s)
    // 60 km/h = 16.6667 m/s
    if (speed && speed > 16.67) {
      const Child = require("../models/Child");
      const User = require("../models/User");
      const { sendPushNotification } = require("../utils/push");
      
      const childLinks = await Child.find({ childId: req.user.id }).populate("parentId");
      const childUser = await User.findById(req.user.id);
      
      for (let link of childLinks) {
        const parent = link.parentId;
        if (parent && parent.expoPushToken) {
          await sendPushNotification(
            parent.expoPushToken,
            "⚠️ Speeding Alert ⚠️",
            `${childUser.name} is travelling at over 60 km/h!`,
            { type: "speeding", childId: req.user.id, speed }
          );
        }
      }
    }

    res.status(201).json(location);
  } catch (err) {
    console.error("Location Save Error:", err);
    res.status(500).json({ error: "Failed to save location" });
  }
});

// Get location history (used by parent app)
router.get("/:childId", auth, async (req, res) => {
  try {
    // In a real app, verify that the child belongs to the requesting parent
    const locations = await Location.find({ childId: req.params.childId })
      .sort({ timestamp: -1 })
      .limit(50); // get last 50 locations
      
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});

module.exports = router;
