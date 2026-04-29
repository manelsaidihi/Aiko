import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticateRequest, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/reviews (يتطلب auth - employer فقط)
router.post('/', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { workerId, requestId, rating, comment } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (userRole !== 'employer') {
      return res.status(403).json({ error: 'Only employers can leave reviews' });
    }

    if (!workerId || !requestId || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // التحقق من الطلب
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: requestId }
    });

    if (!serviceRequest) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    if (serviceRequest.status !== 'completed') {
      return res.status(400).json({ error: 'Only completed services can be reviewed' });
    }

    if (serviceRequest.employerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to review this request' });
    }

    // التحقق مما إذا كان قد تم التقييم مسبقاً
    const existingReview = await prisma.review.findUnique({
      where: { requestId }
    });

    if (existingReview) {
      return res.status(400).json({ error: 'This request has already been reviewed' });
    }

    // حفظ التقييم
    const review = await prisma.review.create({
      data: {
        workerId,
        employerId: userId!,
        requestId,
        rating,
        comment
      }
    });

    // حساب متوسط تقييمات العامل
    const workerReviews = await prisma.review.aggregate({
      where: { workerId },
      _avg: {
        rating: true
      },
      _count: {
        rating: true
      }
    });

    const averageRating = workerReviews._avg.rating || 0;

    // تحديث تقييم العامل في جدول User
    await prisma.user.update({
      where: { id: workerId },
      data: {
        rating: averageRating
      }
    });

    res.status(201).json(review);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reviews/worker/:workerId
router.get('/worker/:workerId', async (req, res) => {
  try {
    const { workerId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { workerId },
      include: {
        employer: {
          select: {
            name: true
          }
        },
        request: {
          select: {
            title: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const aggregate = await prisma.review.aggregate({
      where: { workerId },
      _avg: {
        rating: true
      },
      _count: {
        id: true
      }
    });

    res.json({
      reviews,
      averageRating: aggregate._avg.rating || 0,
      totalReviews: aggregate._count.id
    });
  } catch (error) {
    console.error('Get worker reviews error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
