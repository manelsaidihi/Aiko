import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import authRoutes from "./src/routes/auth";
import serviceRoutes from "./src/routes/services";
import messageRoutes from "./src/routes/messages";
import reviewRoutes from "./src/routes/reviews";
import notificationRoutes from "./src/routes/notifications";
import { prisma } from "./src/db";
import { sendNotification } from "./src/services/notificationService";
import { errorHandler } from "./src/middleware/errorHandler";
import { verifyToken } from "./src/middleware/auth";

async function startServer() {
  const app = express();

  // Security Middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    credentials: true
  }));

  // Rate Limiting
  const globalLimiter = rateLimit({
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW || "15")) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX || "100"),
    message: { error: true, message: "Too many requests from this IP, please try again later.", code: 429 }
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: true, message: "Too many login/register attempts, please try again after 15 minutes.", code: 429 }
  });

  app.use("/api/", globalLimiter);
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);

  // Body Parsing
  app.use(express.json({ limit: '10mb' }));

  // JSON Error Handling
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ error: true, message: "Invalid JSON", code: 400 });
    }
    next(err);
  });

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
      methods: ["GET", "POST"]
    },
  });

  // Socket Auth Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new Error("Authentication error: Invalid token"));
    }
    (socket as any).userId = decoded.id;
    next();
  });

  app.set("io", io);

  const PORT = 3000;

  io.on("connection", (socket) => {
    const userId = (socket as any).userId;
    console.log(`User connected: ${userId} (${socket.id})`);

    // Auto-join user to their private room
    socket.join(`user_${userId}`);

    socket.on("send_message", async (data) => {
      try {
        const senderId = userId;
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
      try {
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

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "Aiko" });
  });

  // Global Error Handler
  app.use(errorHandler);

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
