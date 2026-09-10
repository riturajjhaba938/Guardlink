const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Contact = require("../models/Contact");

// Sync contacts (used by child app)
router.post("/sync", auth, async (req, res) => {
  try {
    const { contacts } = req.body;
    
    // Upsert contacts
    const updatedContact = await Contact.findOneAndUpdate(
      { childId: req.user.id },
      { contacts, lastSynced: Date.now() },
      { new: true, upsert: true }
    );

    res.json(updatedContact);
  } catch (err) {
    res.status(500).json({ error: "Failed to sync contacts" });
  }
});

// Get contacts (used by parent app)
router.get("/:childId", auth, async (req, res) => {
  try {
    const contactData = await Contact.findOne({ childId: req.params.childId });
    res.json(contactData || { contacts: [] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

module.exports = router;
