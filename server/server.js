require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const authRoutes = require("./routes/auth");
const childrenRoutes = require("./routes/children");
const locationRoutes = require("./routes/location");
const contactsRoutes = require("./routes/contacts");
const usersRoutes = require("./routes/users");
const emergencyRoutes = require("./routes/emergency");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Store io instance for routes
app.set("io", io);

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Socket.IO Real-time Connection
io.on("connection", (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.on("join-child", (childId) => {
    socket.join(`child_${childId}`);
    console.log(`[Socket] Joined child room: child_${childId}`);
  });

  socket.on("child-location-update", (data) => {
    console.log("[Socket] Real-time child location update:", data);
    if (data.childId) {
      io.to(`child_${data.childId}`).emit("location-update", data);
    }
  });

  socket.on("disconnect", () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/children", childrenRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/emergency", emergencyRoutes);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

server.listen(PORT, () => {
  console.log(`Server & WebSockets running on port ${PORT}`);
});
