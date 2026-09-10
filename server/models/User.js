const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["parent", "child"], default: "parent" },
  profilePicture: { type: String, default: null },
  expoPushToken: { type: String, default: null },
});

module.exports = mongoose.model("User", userSchema);
