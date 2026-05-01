import express, { Request, Response, NextFunction } from "express";
import { execSync } from "child_process";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import compression from "compression";
import authRoutes from "./src/routes/auth";
import serviceRoutes from "./src/routes/services";
import messageRoutes from "./src/routes/messages";
import reviewRoutes from "./src/routes/reviews";
import notificationRoutes from "./src/routes/notifications";
import availabilityRoutes from "./src/routes/availability";
import applicationRoutes from "./src/routes/applications";
import offerRoutes from "./src/routes/offers";
import { prisma } from "./src/db";
import { sendNotification } from "./src/services/notificationService";
import { errorHandler } from "./src/middleware/errorHandler";
import { verifyToken } from "./src/middleware/auth";

async function startServer() {
  // Sync database schema for Render deployment
  if (process.env.NODE_ENV === 'production') {
    try {
      console.log('Syncing database schema...');
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
      console.log('Database synced successfully');
    } catch (error) {
      console.error('Database sync failed:', error);
    }
  }

  const app = express();

  // Compression
  app.use(compression());

  // Security Middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        fontSrc: ["'self'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "https:", "wss:", "ws:"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      },
    },
  }));
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    credentials: true
  }));

  // Rate Limiting
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: {
      error: true,
      message: "طلبات كثيرة جداً، يرجى المحاولة لاحقاً / Trop de requêtes, réessayez plus tard / Too many requests, try again later",
      code: 429
    }
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
      error: true,
      message: "محاولات كثيرة، انتظر 15 دقيقة / Trop de tentatives, attendez 15 minutes / Too many attempts, wait 15 minutes",
      code: 429
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);
  app.use("/api/", globalLimiter);

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

  const PORT = process.env.PORT || 3000;

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
  app.use("/api/availability", availabilityRoutes);
  app.use("/api/applications", applicationRoutes);
  app.use("/api/offers", offerRoutes);

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
    const publicPath = path.join(process.cwd(), "dist", "public");
    app.use(express.static(publicPath, {
      maxAge: '1y',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      }
    }));

    // Handle deep links for SPA routes to ensure they serve index.html
    const spaRoutes = ["/verify-email", "/reset-password"];
    spaRoutes.forEach(route => {
      app.get(`${route}*`, (req, res) => {
        res.sendFile(path.join(publicPath, "index.html"));
      });
    });

    app.get("*", (req, res) => {
      res.sendFile(path.join(publicPath, "index.html"));
    });
  }

  httpServer.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Aiko server running on http://localhost:${PORT}`);
  });

  // Keep alive ping for Render free tier
  setInterval(async () => {
    try {
      await fetch('https://aiko-app.onrender.com/api/health');
      console.log('Keep alive ping sent');
    } catch (error) {
      console.error('Keep alive failed:', error);
    }
  }, 14 * 60 * 1000); // كل 14 دقيقة
}

startServer();
