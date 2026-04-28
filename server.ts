import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import authRoutes from "./src/routes/auth";
import serviceRoutes from "./src/routes/services";

async function startServer() {
  const app = express();

  // Middleware
  app.use(express.json());

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  app.set("io", io);

  const PORT = 3000;

  // Simple in-memory storage for demo purposes
  const serviceRequests: any[] = [];
  const activeUsers = new Map();

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join", (user) => {
      activeUsers.set(socket.id, user);
      io.emit("users_update", Array.from(activeUsers.values()));
    });

    socket.on("send_message", (data) => {
      // Broadcast message to shared room or specific user
      io.emit("new_message", data);
    });

    socket.on("post_request", (request) => {
      serviceRequests.push(request);
      io.emit("new_request", request);
    });

    socket.on("disconnect", () => {
      activeUsers.delete(socket.id);
      io.emit("users_update", Array.from(activeUsers.values()));
      console.log("User disconnected");
    });
  });

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/services", serviceRoutes);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "Aiko" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Aiko server running on http://localhost:${PORT}`);
  });
}

startServer();
