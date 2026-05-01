import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../db';
import { generateToken, authenticateRequest, AuthRequest } from '../middleware/auth';
import { registerValidation, loginValidation } from '../middleware/validate';
import { sendVerificationEmail, sendResetPasswordEmail } from '../services/emailService';

const router = Router();

// POST /api/auth/check-email
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'هذا البريد مسجل مسبقاً / Cet email est déjà utilisé / This email is already registered'
      });
    }

    res.json({ available: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/register
router.post('/register', registerValidation, async (req, res) => {
  try {
    const { name, email, password, role, phone, location } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'هذا البريد مسجل مسبقاً / Cet email est déjà utilisé / This email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        phone,
        location,
        verificationToken,
        verificationExpires,
        emailVerified: true // Auto-verify for immediate access as requested in account selection fix
      }
    });

    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (err) {
      console.error('Failed to send verification email:', err);
    }

    const token = generateToken(user.id, user.role);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        bio: user.bio,
        avatar: user.avatar,
        portfolio: user.portfolio,
        rating: user.rating,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/verify-email/:token
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await prisma.user.findUnique({
      where: { verificationToken: token }
    });

    if (!user || !user.verificationExpires || user.verificationExpires < new Date()) {
      return res.status(400).json({ error: 'الرابط غير صالح أو انتهت صلاحيته' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationExpires: null
      }
    });

    res.json({ message: 'تم تفعيل الحساب بنجاح، يمكنك الدخول الآن' });
  } catch (error) {
    console.error('Email verification error:', error);
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

    if (!user.emailVerified) {
      return res.status(403).json({ error: 'Please verify your email before logging in' });
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
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        bio: user.bio,
        avatar: user.avatar,
        portfolio: user.portfolio,
        rating: user.rating,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // For security, don't reveal if user exists
      return res.json({ message: 'If an account exists with this email, a reset link has been sent.' });
    }

    const resetPasswordToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken,
        resetPasswordExpires
      }
    });

    try {
      await sendResetPasswordEmail(email, resetPasswordToken);
    } catch (err) {
      console.error('Failed to send reset email:', err);
    }

    res.json({ message: 'If an account exists with this email, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me (also aliased as /api/users/me)
router.get(['/me', '/users/me'], authenticateRequest, async (req: AuthRequest, res) => {
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

// GET /api/auth/user/:id
router.get('/user/:id', authenticateRequest, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        role: true,
        skills: true,
        location: true,
        bio: true,
        avatar: true,
        rating: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user profile error:', error);
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
