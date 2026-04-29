import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticateRequest, AuthRequest } from '../middleware/auth';

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
      dailyRate
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

export default router;
