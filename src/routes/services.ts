import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticateRequest, AuthRequest } from '../middleware/auth';
import { categorizeService } from '../services/geminiService';
import { sendNotification } from '../services/notificationService';
import { createServiceValidation } from '../middleware/validate';

const router = Router();

// POST /api/services (يتطلب auth - employer فقط)
router.post('/', authenticateRequest, createServiceValidation, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, subcategory, location, budget, wilaya } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (userRole !== 'employer') {
      return res.status(403).json({ error: 'Only employers can create service requests' });
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

    // Notify workers in the same category
    const workers = await prisma.user.findMany({
      where: {
        role: 'worker',
        skills: {
          has: category
        }
      },
      select: { id: true }
    });

    for (const worker of workers) {
      await sendNotification(io, {
        userId: worker.id,
        type: 'new_request',
        title: 'طلب جديد في مجالك',
        body: `هناك طلب جديد: ${refinedTitle}`,
        data: { requestId: serviceRequest.id }
      });
    }

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
      },
      include: {
        worker: {
          select: { name: true }
        }
      }
    });

    // يرسل socket event "request_assigned"
    const io = req.app.get('io');
    io.emit('request_assigned', updatedService);

    // Notify the employer
    await sendNotification(io, {
      userId: service.employerId,
      type: 'request_assigned',
      title: 'تم قبول طلبك!',
      body: `العامل ${updatedService.worker?.name} قبل طلبك ${service.title}`,
      data: { requestId: service.id, workerId: userId }
    });

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

    // Notify the other party
    const recipientId = userId === service.employerId ? service.workerId : service.employerId;
    if (recipientId) {
      await sendNotification(io, {
        userId: recipientId,
        type: 'request_completed',
        title: 'تم إتمام الخدمة',
        body: `تم وضع علامة "مكتمل" على الخدمة: ${service.title}`,
        data: { requestId: service.id }
      });
    }

    res.json(updatedService);
  } catch (error) {
    console.error('Complete service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/services/instant (يتطلب auth - employer فقط)
router.post('/instant', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { title, category, wilaya, description } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (userRole !== 'employer') {
      return res.status(403).json({ error: 'Only employers can create instant requests' });
    }

    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        title,
        description,
        category,
        wilaya,
        location: 'Instant Request',
        budget: 'Instant',
        employerId: userId!,
        status: 'open'
      }
    });

    const io = req.app.get('io');

    // Notify available workers in the same category and wilaya
    const availableWorkers = await prisma.workerAvailability.findMany({
      where: {
        category,
        isAvailable: true,
        wilayas: {
          has: wilaya
        }
      },
      select: { workerId: true }
    });

    for (const avail of availableWorkers) {
      await sendNotification(io, {
        userId: avail.workerId,
        type: 'new_request',
        title: 'طلب فوري جديد!',
        body: `هناك طلب فوري في منطقتك: ${title}`,
        data: { requestId: serviceRequest.id, isInstant: true }
      });
    }

    res.status(201).json(serviceRequest);
  } catch (error) {
    console.error('Create instant request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/services/instant/active (يتطلب auth - worker فقط)
router.get('/instant/active', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { wilaya, category } = req.query;
    const userRole = req.user?.role;

    if (userRole !== 'worker') {
      return res.status(403).json({ error: 'Only workers can view active instant requests' });
    }

    const where: any = {
      status: 'open',
      location: 'Instant Request' // Identifying mark for instant requests
    };

    if (wilaya) where.wilaya = wilaya;
    if (category) where.category = category;

    const instantRequests = await prisma.serviceRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        employer: {
          select: {
            id: true,
            name: true,
            rating: true
          }
        }
      }
    });

    res.json(instantRequests);
  } catch (error) {
    console.error('Get active instant requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/services/:id (يتطلب auth - employer صاحب الطلب فقط)
router.put('/:id', authenticateRequest, createServiceValidation, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, category, subcategory, location, budget, wilaya } = req.body;
    const userId = req.user?.id;

    const service = await prisma.serviceRequest.findUnique({
      where: { id }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    if (service.employerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to edit this request' });
    }

    const updatedService = await prisma.serviceRequest.update({
      where: { id },
      data: {
        title,
        description,
        category,
        subcategory,
        location,
        budget,
        wilaya
      }
    });

    res.json(updatedService);
  } catch (error) {
    console.error('Update service request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/services/:id (يتطلب auth - employer صاحب الطلب فقط)
router.delete('/:id', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const service = await prisma.serviceRequest.findUnique({
      where: { id }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    if (service.employerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this request' });
    }

    if (service.status !== 'open') {
      return res.status(400).json({ error: 'Only open requests can be deleted' });
    }

    await prisma.serviceRequest.delete({
      where: { id }
    });

    res.json({ message: 'Service request deleted successfully' });
  } catch (error) {
    console.error('Delete service request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/services/:id/apply (يتطلب auth - worker فقط)
router.post('/:id/apply', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { price, description } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (userRole !== 'worker') {
      return res.status(403).json({ error: 'Only workers can apply for jobs' });
    }

    const service = await prisma.serviceRequest.findUnique({
      where: { id }
    });

    if (!service || service.status !== 'open') {
      return res.status(400).json({ error: 'Job is not available for applications' });
    }

    const application = await prisma.jobApplication.create({
      data: {
        requestId: id,
        workerId: userId!,
        price,
        description
      }
    });

    // Notify employer
    const io = req.app.get('io');
    await sendNotification(io, {
      userId: service.employerId,
      type: 'new_request', // Using existing type or could add 'new_application'
      title: 'تقديم جديد على وظيفتك',
      body: `عامل جديد تقدم لوظيفة: ${service.title}`,
      data: { requestId: id, applicationId: application.id }
    });

    res.status(201).json(application);
  } catch (error) {
    console.error('Apply for job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/services/:id/applicants (يتطلب auth - employer صاحب العمل فقط)
router.get('/:id/applicants', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const service = await prisma.serviceRequest.findUnique({
      where: { id }
    });

    if (!service || service.employerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to view applicants' });
    }

    const applicants = await prisma.jobApplication.findMany({
      where: { requestId: id },
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            avatar: true,
            rating: true,
            bio: true
          }
        }
      }
    });

    res.json(applicants);
  } catch (error) {
    console.error('Get applicants error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/services/applications/:applicationId/status (يتطلب auth - employer فقط)
router.patch('/applications/:applicationId/status', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'
    const userId = req.user?.id;

    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        request: true,
        worker: true
      }
    });

    if (!application || application.request.employerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to update application status' });
    }

    const updatedApplication = await prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status }
    });

    const io = req.app.get('io');

    if (status === 'accepted') {
      // Update service request
      await prisma.serviceRequest.update({
        where: { id: application.requestId },
        data: {
          status: 'assigned',
          workerId: application.workerId
        }
      });

      // Notify worker
      await sendNotification(io, {
        userId: application.workerId,
        type: 'request_assigned',
        title: 'تم قبول عرضك!',
        body: `صاحب العمل قبل عرضك لوظيفة: ${application.request.title}`,
        data: { requestId: application.requestId }
      });

      // Automatically open chat by sending a system/initial message
      await prisma.message.create({
        data: {
          senderId: userId!,
          receiverId: application.workerId,
          text: `مرحباً، لقد قبلت عرضك لوظيفة "${application.request.title}". دعنا نتحدث عن التفاصيل.`
        }
      });

      // Emit socket event for the new message
      io.to(`user_${application.workerId}`).emit('new_message', {
        senderId: userId,
        text: `مرحباً، لقد قبلت عرضك لوظيفة "${application.request.title}". دعنا نتحدث عن التفاصيل.`,
        timestamp: new Date()
      });
    }

    res.json(updatedApplication);
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
