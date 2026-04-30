import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticateRequest, AuthRequest } from '../middleware/auth';
import { sendNotification } from '../services/notificationService';

const router = Router();

// POST /api/availability (worker only)
router.post('/', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (userRole !== 'worker') {
      return res.status(403).json({ error: 'Only workers can post availability' });
    }

    const {
      category,
      subcategories,
      wilayas,
      title,
      description,
      hourlyRate,
      dailyRate,
      type,
      startTime,
      endTime
    } = req.body;

    if (!category || !wilayas || !title || !description || !hourlyRate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const availability = await prisma.workerAvailability.upsert({
      where: { workerId: userId! },
      update: {
        category,
        subcategories,
        wilayas,
        title,
        description,
        hourlyRate: parseFloat(hourlyRate),
        dailyRate: dailyRate ? parseFloat(dailyRate) : null,
        type,
        startTime,
        endTime,
        isAvailable: true
      },
      create: {
        workerId: userId!,
        category,
        subcategories,
        wilayas,
        title,
        description,
        hourlyRate: parseFloat(hourlyRate),
        dailyRate: dailyRate ? parseFloat(dailyRate) : null,
        type,
        startTime,
        endTime,
        isAvailable: true
      }
    });

    res.status(201).json(availability);
  } catch (error) {
    console.error('Create availability error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/availability
router.get('/', async (req, res) => {
  try {
    const { category, wilaya, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      isAvailable: true
    };

    if (category) {
      where.category = category;
    }

    if (wilaya) {
      where.wilayas = {
        has: wilaya as string
      };
    }

    const [availabilities, total] = await Promise.all([
      prisma.workerAvailability.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          worker: {
            select: {
              id: true,
              name: true,
              rating: true,
              location: true
            }
          }
        }
      }),
      prisma.workerAvailability.count({ where })
    ]);

    res.json({
      availabilities,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/availability/toggle
router.patch('/toggle', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (userRole !== 'worker') {
      return res.status(403).json({ error: 'Only workers can toggle availability' });
    }

    const currentAvailability = await prisma.workerAvailability.findUnique({
      where: { workerId: userId! }
    });

    if (!currentAvailability) {
      return res.status(404).json({ error: 'Availability not found' });
    }

    const updated = await prisma.workerAvailability.update({
      where: { workerId: userId! },
      data: {
        isAvailable: !currentAvailability.isAvailable
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Toggle availability error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/availability/me
router.get('/me', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const availability = await prisma.workerAvailability.findUnique({
      where: { workerId: userId! }
    });
    res.json(availability);
  } catch (error) {
    console.error('Get my availability error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/availability/:id/offer (يتطلب auth - employer فقط)
router.post('/:id/offer', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // availabilityId
    const { requestId } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (userRole !== 'employer') {
      return res.status(403).json({ error: 'Only employers can send offers' });
    }

    const availability = await prisma.workerAvailability.findUnique({
      where: { id },
      include: { worker: true }
    });

    if (!availability) {
      return res.status(404).json({ error: 'Worker availability not found' });
    }

    const offer = await prisma.serviceOffer.create({
      data: {
        employerId: userId!,
        workerId: availability.workerId,
        availabilityId: id,
        requestId: requestId || null
      }
    });

    // Notify worker
    const io = req.app.get('io');
    await sendNotification(io, {
      userId: availability.workerId,
      type: 'new_request',
      title: 'عرض عمل جديد!',
      body: `لقد تلقيت عرض عمل جديد من صاحب عمل.`,
      data: { offerId: offer.id, availabilityId: id }
    });

    res.status(201).json(offer);
  } catch (error) {
    console.error('Send offer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/availability/my-offers (يتطلب auth - worker فقط)
router.get('/my-offers', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (userRole !== 'worker') {
      return res.status(403).json({ error: 'Only workers can view their offers' });
    }

    const offers = await prisma.serviceOffer.findMany({
      where: { workerId: userId },
      include: {
        employer: {
          select: {
            id: true,
            name: true,
            avatar: true,
            rating: true
          }
        },
        request: {
          select: {
            id: true,
            title: true,
            budget: true
          }
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

// PATCH /api/availability/offers/:offerId/status (يتطلب auth - worker فقط)
router.patch('/offers/:offerId/status', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { offerId } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'
    const userId = req.user?.id;

    const offer = await prisma.serviceOffer.findUnique({
      where: { id: offerId }
    });

    if (!offer || offer.workerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to update offer status' });
    }

    const updatedOffer = await prisma.serviceOffer.update({
      where: { id: offerId },
      data: { status }
    });

    if (status === 'accepted' && offer.requestId) {
      // Update service request if linked
      await prisma.serviceRequest.update({
        where: { id: offer.requestId },
        data: {
          status: 'assigned',
          workerId: userId
        }
      });

      // Notify employer
      const io = req.app.get('io');
      await sendNotification(io, {
        userId: offer.employerId,
        type: 'request_assigned',
        title: 'تم قبول عرضك!',
        body: `العامل قبل عرضك الذي أرسلته له.`,
        data: { requestId: offer.requestId, offerId }
      });

      // Automatically open chat
      const service = await prisma.serviceRequest.findUnique({ where: { id: offer.requestId } });
      await prisma.message.create({
        data: {
          senderId: userId!,
          receiverId: offer.employerId,
          text: `مرحباً، لقد قبلت عرض العمل الذي أرسلته لي بخصوص "${service?.title}".`
        }
      });

      io.to(`user_${offer.employerId}`).emit('new_message', {
        senderId: userId,
        text: `مرحباً، لقد قبلت عرض العمل الذي أرسلته لي بخصوص "${service?.title}".`,
        timestamp: new Date()
      });
    }

    res.json(updatedOffer);
  } catch (error) {
    console.error('Update offer status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
