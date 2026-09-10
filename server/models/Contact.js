const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  childId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  contacts: [
    {
      name: String,
      phoneNumbers: [{ number: String }]
    }
  ],
  lastSynced: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Contact", contactSchema);
