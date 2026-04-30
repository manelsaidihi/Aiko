import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticateRequest, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/messages/:userId
// Fetch conversation history between current user and specified user
router.get('/:userId', authenticateRequest, async (req: AuthRequest, res) => {
  try {
    const currentUserId = req.user?.id;
    const { userId } = req.params;

    if (!currentUserId) return res.status(401).json({ error: 'Unauthorized' });

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: userId },
          { senderId: userId, receiverId: currentUserId },
        ],
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 50,
      include: {
        sender: {
          select: { id: true, name: true }
        },
        receiver: {
          select: { id: true, name: true }
        }
      }
    });

    // Reverse to get oldest to newest
    res.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/messages/conversations
// List all conversations with last message and unread count
router.get('/conversations', authenticateRequest, async (req: AuthRequest, res) => {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) return res.status(401).json({ error: 'Unauthorized' });

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId },
          { receiverId: currentUserId },
        ],
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    const conversationMap = new Map();

    for (const msg of messages) {
      const otherUserId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          lastMessage: msg,
          unreadCount: 0,
        });
      }

      if (msg.receiverId === currentUserId && !msg.isRead) {
        conversationMap.get(otherUserId).unreadCount++;
      }
    }

    const conversations = [];
    for (const [otherUserId, data] of conversationMap.entries()) {
      const otherUser = await prisma.user.findUnique({
        where: { id: otherUserId },
        select: { id: true, name: true, role: true, avatar: true }
      });

      if (otherUser) {
        conversations.push({
          otherUser,
          lastMessage: data.lastMessage,
          unreadCount: data.unreadCount,
        });
      }
    }

    conversations.sort((a, b) =>
      new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
    );

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/messages/review
router.post('/review', authenticateRequest, async (req: AuthRequest, res) => {
  try {
    const employerId = req.user?.id;
    const { targetUserId, rating, comment } = req.body;

    if (!employerId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const currentRating = user.rating || 0;
    const newRating = (currentRating + rating) / 2; // Simplistic average

    await prisma.user.update({
      where: { id: targetUserId },
      data: { rating: newRating }
    });

    res.json({ success: true, newRating });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
