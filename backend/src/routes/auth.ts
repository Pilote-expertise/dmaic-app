import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../index';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth';
import { sendPasswordResetEmail, sendPasswordChangedEmail } from '../services/email';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  firstName: z.string().min(2, 'Le prénom est requis'),
  lastName: z.string().min(2, 'Le nom est requis')
});

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis')
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide')
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requis'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères')
});

// POST /api/auth/register - Crée une demande d'accès (pas un utilisateur direct)
router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Vérifier si une demande existe déjà
    const existingRequest = await prisma.accessRequest.findUnique({
      where: { email: data.email }
    });

    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        return res.status(400).json({
          error: 'Une demande d\'accès est déjà en cours pour cet email'
        });
      }
      if (existingRequest.status === 'REJECTED') {
        // Permettre de re-soumettre après un rejet
        await prisma.accessRequest.delete({
          where: { id: existingRequest.id }
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Créer la demande d'accès
    const accessRequest = await prisma.accessRequest.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        status: 'PENDING'
      }
    });

    // Notifier les admins
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' }
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          type: 'ACCESS_REQUEST',
          title: 'Nouvelle demande d\'accès',
          message: `${data.firstName} ${data.lastName} (${data.email}) a demandé l'accès à l'application`,
          link: '/admin?tab=requests'
        }))
      });
    }

    res.status(201).json({
      message: 'Votre demande d\'accès a été envoyée. Vous recevrez un email une fois approuvée.',
      requestId: accessRequest.id
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user) {
      // Vérifier si une demande est en attente
      const pendingRequest = await prisma.accessRequest.findUnique({
        where: { email: data.email, status: 'PENDING' }
      });

      if (pendingRequest) {
        return res.status(401).json({
          error: 'Votre demande d\'accès est en cours de validation. Vous recevrez un email une fois approuvée.'
        });
      }

      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(data.password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const token = generateToken(user);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar
      },
      token
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const data = forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    // Toujours retourner le même message pour éviter l'énumération d'utilisateurs
    if (!user) {
      return res.json({
        message: 'Si cet email existe, vous recevrez un lien de réinitialisation.'
      });
    }

    // Invalider les anciens tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true }
    });

    // Créer un nouveau token (expire dans 1 heure)
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt
      }
    });

    // Envoyer l'email
    await sendPasswordResetEmail(user.email, user.firstName, token);

    res.json({
      message: 'Si cet email existe, vous recevrez un lien de réinitialisation.'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Erreur lors de la demande de réinitialisation' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const data = resetPasswordSchema.parse(req.body);

    // Trouver le token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: data.token },
      include: { user: true }
    });

    if (!resetToken) {
      return res.status(400).json({ error: 'Token invalide ou expiré' });
    }

    if (resetToken.used) {
      return res.status(400).json({ error: 'Ce lien a déjà été utilisé' });
    }

    if (resetToken.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Ce lien a expiré. Veuillez faire une nouvelle demande.' });
    }

    // Hash le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Mettre à jour le mot de passe et marquer le token comme utilisé
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true }
      })
    ]);

    // Envoyer l'email de confirmation
    await sendPasswordChangedEmail(resetToken.user.email, resetToken.user.firstName);

    // Log l'action
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'User',
        entityId: resetToken.userId,
        userId: resetToken.userId,
        changes: JSON.stringify({ field: 'password', action: 'reset' })
      }
    });

    res.json({ message: 'Votre mot de passe a été réinitialisé avec succès' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation du mot de passe' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, (req, res) => {
  res.json({ message: 'Déconnexion réussie' });
});

export default router;
