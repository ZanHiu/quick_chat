import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoute.js";
import messageRoute from "./routes/messageRoute.js";

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.io server
export const io = new Server(server, {
  cors: { origin: "*" }
});

// Store online users
export const userSocketMap = {}; // { userId: socketId }

// Socket.io event handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User connected", userId);
  if (userId) {
    userSocketMap[userId] = socket.id;
  }

  // Emit online users to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected", userId);
    delete userSocketMap[userId];
    
    // Emit updated online users to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// Middleware setup
app.use(express.json({limit: "4mb"}));
app.use(cors());

// Routes setup
app.use("/api/status", (req, res) => res.send("Server is running"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRoute);

// Connect to MongoDB
await connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}/`));