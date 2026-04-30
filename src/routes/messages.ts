import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticateRequest, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/messages/conversations
// List all conversations with last message and unread count
router.get('/conversations', authenticateRequest, async (req: AuthRequest, res) => {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) return res.status(401).json({ error: 'Unauthorized' });

    // Optimized conversation fetching: Get all unique conversation partners
    const sentTo = await prisma.message.findMany({
      where: { senderId: currentUserId },
      distinct: ['receiverId'],
      select: { receiverId: true }
    });

    const receivedFrom = await prisma.message.findMany({
      where: { receiverId: currentUserId },
      distinct: ['senderId'],
      select: { senderId: true }
    });

    const partnerIds = Array.from(new Set([
      ...sentTo.map(m => m.receiverId),
      ...receivedFrom.map(m => m.senderId)
    ]));

    const conversationsResult = await Promise.all(partnerIds.map(async (partnerId) => {
      const lastMessage = await prisma.message.findFirst({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: partnerId },
            { senderId: partnerId, receiverId: currentUserId }
          ]
        },
        orderBy: { timestamp: 'desc' }
      });

      if (!lastMessage) return null;

      const unreadCount = await prisma.message.count({
        where: {
          senderId: partnerId,
          receiverId: currentUserId,
          isRead: false
        }
      });

      const otherUser = await prisma.user.findUnique({
        where: { id: partnerId },
        select: { id: true, name: true, role: true, avatar: true }
      });

      if (!otherUser) return null;

      return {
        otherUser,
        lastMessage,
        unreadCount
      };
    }));

    const conversations = conversationsResult.filter((c): c is any => c !== null);

    conversations.sort((a, b) =>
      new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
    );

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
