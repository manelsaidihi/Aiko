import { prisma } from "../db";
import { Server } from "socket.io";

export interface CreateNotificationParams {
  userId: string;
  type: "new_request" | "request_assigned" | "new_message" | "request_completed" | "new_review" | "new_application" | "application_accepted" | "application_rejected" | "new_offer" | "offer_accepted" | "offer_rejected";
  title: string;
  body: string;
  data?: any;
}

export async function createNotification({
  userId,
  type,
  title,
  body,
  data
}: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        data: data || {},
      }
    });

    // Access the io instance (should be set in server.ts)
    // In a real scenario, we might need a better way to access io,
    // but the prompt says to send socket event to user_${userId}
    // We can assume the io instance is available or will be passed somehow.
    // For now, we'll try to get it from the app instance if possible,
    // or just assume it's globally available if we set it up that way.
    // However, the standard way in this project seems to be app.get('io').
    // Since this is a service, we'll need to pass io or use a global one.

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Sends a notification and emits a socket event.
 * @param io Socket.io server instance
 * @param params Notification parameters
 */
export async function sendNotification(io: Server, params: CreateNotificationParams) {
  const notification = await createNotification(params);
  io.to(`user_${params.userId}`).emit("notification", notification);
  return notification;
}
