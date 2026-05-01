import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticateRequest, AuthRequest } from '../middleware/auth';
import { sendNotification } from '../services/notificationService';

const router = Router();

// POST /api/offers (صاحب عمل يرسل عرضاً)
router.post('/', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { availabilityId, price, timing, message } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (userRole !== 'employer') {
      return res.status(403).json({ error: 'Only employers can send offers' });
    }

    const availability = await prisma.workerAvailability.findUnique({
      where: { id: availabilityId }
    });

    if (!availability) {
      return res.status(404).json({ error: 'Worker availability not found' });
    }

    const offer = await prisma.workerOffer.create({
      data: {
        employerId: userId!,
        workerId: availability.workerId,
        availabilityId,
        price: parseFloat(price),
        timing,
        message,
        status: 'pending'
      }
    });

    // Notify worker
    const io = req.app.get('io');
    await sendNotification(io, {
      userId: availability.workerId,
      type: 'new_offer',
      title: 'عرض عمل جديد!',
      body: 'لديك عرض عمل جديد',
      data: { offerId: offer.id }
    });

    res.status(201).json({ message: 'تم إرسال عرضك بنجاح', offer });
  } catch (error) {
    console.error('Send offer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/offers/my (عروض العامل)
router.get('/my', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (userRole !== 'worker') {
      return res.status(403).json({ error: 'Only workers can view their offers' });
    }

    const offers = await prisma.workerOffer.findMany({
      where: { workerId: userId },
      include: {
        employer: {
          select: { name: true, avatar: true, rating: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(offers);
  } catch (error) {
    console.error('Get my offers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/offers/:id/accept
router.patch('/:id/accept', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const offer = await prisma.workerOffer.findUnique({
      where: { id }
    });

    if (!offer || offer.workerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedOffer = await prisma.workerOffer.update({
      where: { id },
      data: { status: 'accepted' },
      include: {
        employer: {
          select: { id: true, name: true, avatar: true, role: true }
        }
      }
    });

    // Notify employer
    const io = req.app.get('io');
    await sendNotification(io, {
      userId: offer.employerId,
      type: 'offer_accepted',
      title: 'تم قبول عرضك!',
      body: 'تم قبول عرضك من قبل العامل',
      data: { offerId: id, senderId: userId }
    });

    // Automatically open chat
    await prisma.message.create({
      data: {
        senderId: userId!,
        receiverId: offer.employerId,
        text: `مرحباً، لقد قبلت عرض العمل الذي أرسلته لي بخصوص "${offer.message || 'عرض عمل'}".`
      }
    });

    io.to(`user_${offer.employerId}`).emit('new_message', {
      senderId: userId,
      text: `مرحباً، لقد قبلت عرض العمل الذي أرسلته لي بخصوص "${offer.message || 'عرض عمل'}".`,
      timestamp: new Date()
    });

    res.json(updatedOffer);
  } catch (error) {
    console.error('Accept offer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/offers/:id/reject
router.patch('/:id/reject', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const offer = await prisma.workerOffer.findUnique({
      where: { id }
    });

    if (!offer || offer.workerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedOffer = await prisma.workerOffer.update({
      where: { id },
      data: { status: 'rejected' }
    });

    // Notify employer
    const io = req.app.get('io');
    await sendNotification(io, {
      userId: offer.employerId,
      type: 'offer_rejected',
      title: 'تم رفض عرضك',
      body: 'تم رفض عرضك من قبل العامل',
      data: { offerId: id, senderId: userId }
    });

    res.json(updatedOffer);
  } catch (error) {
    console.error('Reject offer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/offers/:id
router.delete('/:id', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const offer = await prisma.workerOffer.findUnique({
      where: { id }
    });

    if (!offer || (offer.workerId !== userId && offer.employerId !== userId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.workerOffer.delete({
      where: { id }
    });

    res.json({ message: 'Offer deleted' });
  } catch (error) {
    console.error('Delete offer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
