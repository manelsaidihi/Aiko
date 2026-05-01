import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticateRequest, AuthRequest } from '../middleware/auth';
import { sendNotification } from '../services/notificationService';

const router = Router();

// POST /api/applications (عامل يتقدم لوظيفة)
router.post('/', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { serviceRequestId } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (userRole !== 'worker') {
      return res.status(403).json({ error: 'Only workers can apply for jobs' });
    }

    const service = await prisma.serviceRequest.findUnique({
      where: { id: serviceRequestId }
    });

    if (!service || service.status !== 'open') {
      return res.status(400).json({ error: 'Job is not available for applications' });
    }

    const application = await prisma.jobApplication.create({
      data: {
        serviceRequestId,
        workerId: userId!,
        status: 'pending'
      }
    });

    // Notify employer
    const io = req.app.get('io');
    await sendNotification(io, {
      userId: service.employerId,
      type: 'new_request',
      title: 'تقديم جديد على وظيفتك',
      body: `عامل جديد تقدم لوظيفة: ${service.title}`,
      data: { requestId: serviceRequestId, applicationId: application.id }
    });

    res.status(201).json(application);
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/applications/my (طلبات العامل)
router.get('/my', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const applications = await prisma.jobApplication.findMany({
      where: { workerId: userId },
      include: {
        request: {
          include: {
            employer: {
              select: { name: true, avatar: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(applications);
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/applications/:id/accept
router.patch('/:id/accept', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const application = await prisma.jobApplication.findUnique({
      where: { id },
      include: { request: true }
    });

    if (!application || application.request.employerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedApplication = await prisma.jobApplication.update({
      where: { id },
      data: { status: 'accepted' }
    });

    // Update service request
    await prisma.serviceRequest.update({
      where: { id: application.serviceRequestId },
      data: {
        status: 'assigned',
        workerId: application.workerId
      }
    });

    // Reject other applications for the same request
    await prisma.jobApplication.updateMany({
      where: {
        serviceRequestId: application.serviceRequestId,
        id: { not: id }
      },
      data: { status: 'rejected' }
    });

    // Notify worker
    const io = req.app.get('io');
    await sendNotification(io, {
      userId: application.workerId,
      type: 'request_assigned',
      title: 'تم قبول طلبك!',
      body: `صاحب العمل قبل طلبك لوظيفة: ${application.request.title}`,
      data: { requestId: application.serviceRequestId }
    });

    // Open chat
    await prisma.message.create({
      data: {
        senderId: userId!,
        receiverId: application.workerId,
        text: `مرحباً، لقد قبلت طلبك لوظيفة "${application.request.title}". دعنا نتحدث.`
      }
    });

    io.to(`user_${application.workerId}`).emit('new_message', {
      senderId: userId,
      text: `مرحباً، لقد قبلت طلبك لوظيفة "${application.request.title}". دعنا نتحدث.`,
      timestamp: new Date()
    });

    res.json(updatedApplication);
  } catch (error) {
    console.error('Accept application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/applications/:id/reject
router.patch('/:id/reject', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const application = await prisma.jobApplication.findUnique({
      where: { id },
      include: { request: true }
    });

    if (!application || application.request.employerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedApplication = await prisma.jobApplication.update({
      where: { id },
      data: { status: 'rejected' }
    });

    // Notify worker
    const io = req.app.get('io');
    await sendNotification(io, {
      userId: application.workerId,
      type: 'request_completed', // Using existing type for rejection
      title: 'تم رفض طلبك',
      body: `تم رفض طلبك للتقديم على: ${application.request.title}`,
      data: { requestId: application.serviceRequestId }
    });

    res.json(updatedApplication);
  } catch (error) {
    console.error('Reject application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/applications/:id
router.delete('/:id', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const application = await prisma.jobApplication.findUnique({
      where: { id }
    });

    if (!application || application.workerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.jobApplication.delete({
      where: { id }
    });

    res.json({ message: 'Application deleted' });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
