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

    const existingApplication = await prisma.jobApplication.findFirst({
      where: {
        serviceRequestId,
        workerId: userId!
      }
    });

    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied for this job' });
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
      body: 'تقدم عامل جديد على وظيفتك',
      data: { requestId: serviceRequestId, applicationId: application.id }
    });

    res.status(201).json({ message: 'تم إرسال طلبك بنجاح', application });
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
        serviceRequest: {
          include: {
            employer: {
              select: { name: true, avatar: true, rating: true }
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

// GET /api/applications/job/:serviceRequestId (employer)
router.get('/job/:serviceRequestId', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { serviceRequestId } = req.params;
    const userId = req.user?.id;

    const service = await prisma.serviceRequest.findUnique({
      where: { id: serviceRequestId }
    });

    if (!service || service.employerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to view applicants' });
    }

    const applicants = await prisma.jobApplication.findMany({
      where: { serviceRequestId },
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            avatar: true,
            rating: true,
            bio: true,
            skills: true
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

// PATCH /api/applications/:id/accept
router.patch('/:id/accept', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const application = await prisma.jobApplication.findUnique({
      where: { id },
      include: { serviceRequest: true }
    });

    if (!application || application.serviceRequest.employerId !== userId) {
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

    // Notify worker
    const io = req.app.get('io');
    await sendNotification(io, {
      userId: application.workerId,
      type: 'request_assigned',
      title: 'تم قبول طلبك!',
      body: `صاحب العمل قبل طلبك لوظيفة: ${application.serviceRequest.title}`,
      data: { requestId: application.serviceRequestId, senderId: userId }
    });

    // Automatically open chat
    await prisma.message.create({
      data: {
        senderId: userId!,
        receiverId: application.workerId,
        text: `مرحباً، لقد قبلت طلبك لوظيفة "${application.serviceRequest.title}". دعنا نتحدث.`
      }
    });

    io.to(`user_${application.workerId}`).emit('new_message', {
      senderId: userId,
      text: `مرحباً، لقد قبلت طلبك لوظيفة "${application.serviceRequest.title}". دعنا نتحدث.`,
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
      include: { serviceRequest: true }
    });

    if (!application || application.serviceRequest.employerId !== userId) {
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
      type: 'request_completed',
      title: 'تم رفض طلبك',
      body: `تم رفض طلبك للتقديم على: ${application.serviceRequest.title}`,
      data: { requestId: application.serviceRequestId, senderId: userId }
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
