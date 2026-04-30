import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { generateToken, authenticateRequest, AuthRequest } from '../middleware/auth';
import { registerValidation, loginValidation } from '../middleware/validate';

const router = Router();

// POST /api/auth/register
router.post('/register', registerValidation, async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        // Optional phone can be stored in skills or a metadata field if not in schema,
        // but based on the User model in schema.prisma, we only have certain fields.
        // Let's stick to the schema fields.
      }
    });

    const token = generateToken(user.id, user.role);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id, user.role);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateRequest, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        skills: true,
        location: true,
        phone: true,
        bio: true,
        avatar: true,
        portfolio: true,
        rating: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/auth/profile
router.patch('/profile', authenticateRequest, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { name, email, phone, bio, location, avatar, portfolio } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        phone,
        bio,
        location,
        avatar,
        portfolio
      }
    });

    res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      phone: updatedUser.phone,
      bio: updatedUser.bio,
      location: updatedUser.location,
      avatar: updatedUser.avatar,
      portfolio: updatedUser.portfolio
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/auth/account
router.delete('/account', authenticateRequest, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await prisma.$transaction([
      // 1. Delete notifications
      prisma.notification.deleteMany({ where: { userId } }),

      // 2. Delete worker availability
      prisma.workerAvailability.deleteMany({ where: { workerId: userId } }),

      // 3. Delete messages
      prisma.message.deleteMany({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ]
        }
      }),

      // 4. Delete reviews
      prisma.review.deleteMany({
        where: {
          OR: [
            { workerId: userId },
            { employerId: userId }
          ]
        }
      }),

      // 5. Delete service requests
      prisma.serviceRequest.deleteMany({
        where: {
          OR: [
            { employerId: userId },
            { workerId: userId }
          ]
        }
      }),

      // 6. Delete user
      prisma.user.delete({ where: { id: userId } })
    ]);

    res.json({ message: "تم حذف الحساب بنجاح" });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
