import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import jwt from "jsonwebtoken";
import authRoutes from "./src/routes/auth";
import serviceRoutes from "./src/routes/services";
import messageRoutes from "./src/routes/messages";
import reviewRoutes from "./src/routes/reviews";
import notificationRoutes from "./src/routes/notifications";
import availabilityRoutes from "./src/routes/availability";
import { prisma } from "./src/db";
import { sendNotification } from "./src/services/notificationService";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

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

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join", (data) => {
      const token = socket.handshake.auth.token || data?.token;
      if (!token) return;

      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const userId = decoded.id;
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined their room`);
      } catch (err) {
        console.error("Auth error in socket join");
      }
    });

    socket.on("send_message", async (data) => {
      const token = socket.handshake.auth.token || data?.token;
      if (!token) return;

      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const senderId = decoded.id;
        const { receiverId, text } = data;

        const message = await prisma.message.create({
          data: {
            senderId,
            receiverId,
            text,
          },
          include: {
            sender: { select: { name: true } }
          }
        });

        // Send to receiver
        io.to(`user_${receiverId}`).emit("new_message", message);
        // Confirm to sender
        socket.emit("message_sent", message);

        // Send notification for new message
        await sendNotification(io, {
          userId: receiverId,
          type: "new_message",
          title: "رسالة جديدة",
          body: `وصلتك رسالة من ${message.sender.name}`,
          data: { senderId, messageId: message.id }
        });
      } catch (err) {
        console.error("Error sending message via socket:", err);
      }
    });

    socket.on("mark_read", async (data) => {
      const token = socket.handshake.auth.token || data?.token;
      if (!token) return;

      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const userId = decoded.id;
        const { otherUserId } = data;

        await prisma.message.updateMany({
          where: {
            senderId: otherUserId,
            receiverId: userId,
            isRead: false,
          },
          data: { isRead: true },
        });
      } catch (err) {
        console.error("Error marking messages as read:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/services", serviceRoutes);
  app.use("/api/messages", messageRoutes);
  app.use("/api/reviews", reviewRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/availability", availabilityRoutes);

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
