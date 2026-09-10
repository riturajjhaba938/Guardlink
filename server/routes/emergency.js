const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Child = require("../models/Child");
const User = require("../models/User");
const { sendPushNotification } = require("../utils/push");

// Send emergency notification
router.post("/", auth, async (req, res) => {
  try {
    // Only a child can trigger an emergency
    if (req.user.role !== "child") {
      return res.status(403).json({ error: "Only a child can trigger an emergency." });
    }

    // Find the parent(s) linked to this child
    const childLinks = await Child.find({ childId: req.user.id }).populate("parentId");
    if (!childLinks || childLinks.length === 0) {
      return res.status(404).json({ error: "No parent found for this child." });
    }

    const childUser = await User.findById(req.user.id);
    let notificationsSent = 0;

    for (let link of childLinks) {
      const parent = link.parentId;
      if (parent && parent.expoPushToken) {
        await sendPushNotification(
          parent.expoPushToken,
          "🚨 EMERGENCY ALERT 🚨",
          `${childUser.name} has pressed the Emergency Button! Check their location immediately.`,
          { type: "emergency", childId: req.user.id }
        );
        notificationsSent++;
      }
    }

    res.json({ message: "Emergency alert sent successfully", count: notificationsSent });
  } catch (err) {
    console.error("Emergency Alert Error:", err);
    res.status(500).json({ error: "Failed to send emergency alert" });
  }
});

module.exports = router;
