import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticateRequest, AuthRequest } from '../middleware/auth';
import { categorizeService } from '../services/geminiService';

const router = Router();

// POST /api/services (يتطلب auth - employer فقط)
router.post('/', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, subcategory, location, budget, wilaya } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (userRole !== 'employer') {
      return res.status(403).json({ error: 'Only employers can create service requests' });
    }

    if (!title || !description || !category || !location || !budget || !wilaya) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // استدع geminiService.categorizeService() لتحسين العنوان تلقائياً
    const aiResult = await categorizeService(description);
    const refinedTitle = aiResult.refined_title || title;

    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        title: refinedTitle,
        description,
        category,
        subcategory,
        location,
        budget,
        wilaya,
        employerId: userId!,
        status: 'open'
      }
    });

    // أرسل socket event "new_request" لجميع العمال المتصلين
    const io = req.app.get('io');
    io.emit('new_request', serviceRequest);

    res.status(201).json(serviceRequest);
  } catch (error) {
    console.error('Create service request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/services
router.get('/', async (req, res) => {
  try {
    const { category, wilaya, status, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (category) where.category = category;
    if (wilaya) where.wilaya = wilaya;
    if (status) where.status = status;

    const [services, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          employer: {
            select: {
              id: true,
              name: true,
              location: true,
              rating: true
            }
          }
        }
      }),
      prisma.serviceRequest.count({ where })
    ]);

    res.json({
      services,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/services/my/requests (يتطلب auth)
router.get('/my/requests', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    let requests;
    if (userRole === 'employer') {
      requests = await prisma.serviceRequest.findMany({
        where: { employerId: userId },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      requests = await prisma.serviceRequest.findMany({
        where: { workerId: userId },
        orderBy: { createdAt: 'desc' }
      });
    }

    res.json(requests);
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/services/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const service = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        employer: {
          select: {
            id: true,
            name: true,
            location: true,
            rating: true,
            createdAt: true
          }
        },
        worker: {
          select: {
            id: true,
            name: true,
            rating: true
          }
        }
      }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    res.json(service);
  } catch (error) {
    console.error('Get service detail error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/services/:id/assign (يتطلب auth - worker فقط)
router.patch('/:id/assign', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (userRole !== 'worker') {
      return res.status(403).json({ error: 'Only workers can accept service requests' });
    }

    const service = await prisma.serviceRequest.findUnique({
      where: { id }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    if (service.status !== 'open') {
      return res.status(400).json({ error: 'Service request is not open' });
    }

    const updatedService = await prisma.serviceRequest.update({
      where: { id },
      data: {
        status: 'assigned',
        workerId: userId
      }
    });

    // يرسل socket event "request_assigned"
    const io = req.app.get('io');
    io.emit('request_assigned', updatedService);

    res.json(updatedService);
  } catch (error) {
    console.error('Assign service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/services/:id/complete (يتطلب auth)
router.patch('/:id/complete', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const service = await prisma.serviceRequest.findUnique({
      where: { id }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    // Only employer or assigned worker can mark as completed
    if (service.employerId !== userId && service.workerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to complete this request' });
    }

    const updatedService = await prisma.serviceRequest.update({
      where: { id },
      data: { status: 'completed' }
    });

    // يرسل socket event "request_completed"
    const io = req.app.get('io');
    io.emit('request_completed', updatedService);

    res.json(updatedService);
  } catch (error) {
    console.error('Complete service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
