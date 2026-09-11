const mongoose = require("mongoose");

const childSchema = new mongoose.Schema({
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  childId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  pairingCode: { type: String }, // Optional: if using codes to pair
});

module.exports = mongoose.model("Child", childSchema);
