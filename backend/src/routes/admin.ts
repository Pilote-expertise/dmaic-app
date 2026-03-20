import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../index';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth';
import { sendWelcomeEmail, sendRejectionEmail, sendPasswordResetEmail } from '../services/email';

const router = Router();

// Tous les endpoints admin nécessitent auth + admin
router.use(authMiddleware, adminMiddleware);

// ============ DEMANDES D'ACCÈS ============

// GET /api/admin/access-requests - Liste des demandes
router.get('/access-requests', async (req: AuthRequest, res) => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status && typeof status === 'string') {
      where.status = status;
    }

    const requests = await prisma.accessRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        reviewedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json(requests);
  } catch (error) {
    console.error('Get access requests error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des demandes' });
  }
});

// POST /api/admin/access-requests/:id/approve - Approuver une demande
router.post('/access-requests/:id/approve', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const request = await prisma.accessRequest.findUnique({
      where: { id }
    });

    if (!request) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: 'Cette demande a déjà été traitée' });
    }

    // Vérifier que l'email n'est pas déjà utilisé
    const existingUser = await prisma.user.findUnique({
      where: { email: request.email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Un utilisateur avec cet email existe déjà' });
    }

    // Créer l'utilisateur et mettre à jour la demande en transaction
    const [user] = await prisma.$transaction([
      prisma.user.create({
        data: {
          email: request.email,
          password: request.password, // Déjà hashé
          firstName: request.firstName,
          lastName: request.lastName,
          role: 'CONTRIBUTOR'
        }
      }),
      prisma.accessRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedById: req.user!.id
        }
      }),
      prisma.auditLog.create({
        data: {
          action: 'CREATE',
          entityType: 'User',
          entityId: id,
          userId: req.user!.id,
          changes: JSON.stringify({
            action: 'access_request_approved',
            email: request.email,
            firstName: request.firstName,
            lastName: request.lastName
          })
        }
      })
    ]);

    // Envoyer l'email de bienvenue
    await sendWelcomeEmail(request.email, request.firstName);

    res.json({
      message: 'Demande approuvée avec succès',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'approbation de la demande' });
  }
});

// POST /api/admin/access-requests/:id/reject - Rejeter une demande
router.post('/access-requests/:id/reject', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const request = await prisma.accessRequest.findUnique({
      where: { id }
    });

    if (!request) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: 'Cette demande a déjà été traitée' });
    }

    await prisma.$transaction([
      prisma.accessRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reason: reason || null,
          reviewedAt: new Date(),
          reviewedById: req.user!.id
        }
      }),
      prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entityType: 'AccessRequest',
          entityId: id,
          userId: req.user!.id,
          changes: JSON.stringify({
            action: 'access_request_rejected',
            email: request.email,
            reason: reason || 'Non spécifiée'
          })
        }
      })
    ]);

    // Envoyer l'email de rejet
    await sendRejectionEmail(request.email, request.firstName, reason);

    res.json({ message: 'Demande rejetée' });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ error: 'Erreur lors du rejet de la demande' });
  }
});

// ============ GESTION DES UTILISATEURS ============

// GET /api/admin/users - Liste des utilisateurs
router.get('/users', async (req: AuthRequest, res) => {
  try {
    const { search, role } = req.query;

    const where: any = {};

    if (search && typeof search === 'string') {
      where.OR = [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } }
      ];
    }

    if (role && typeof role === 'string') {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            ownedProjects: true,
            contributions: true
          }
        }
      }
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
  }
});

// PUT /api/admin/users/:id - Modifier un utilisateur
const updateUserSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'CONTRIBUTOR']).optional(),
  email: z.string().email().optional()
});

router.put('/users/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = updateUserSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Empêcher de modifier son propre rôle
    if (id === req.user!.id && data.role && data.role !== user.role) {
      return res.status(400).json({ error: 'Vous ne pouvez pas modifier votre propre rôle' });
    }

    // Vérifier l'unicité de l'email si modifié
    if (data.email && data.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });
      if (existingUser) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Log l'action
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'User',
        entityId: id,
        userId: req.user!.id,
        changes: JSON.stringify(data)
      }
    });

    res.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'utilisateur' });
  }
});

// DELETE /api/admin/users/:id - Supprimer un utilisateur
router.delete('/users/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Empêcher de se supprimer soi-même
    if (id === req.user!.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: { ownedProjects: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier si l'utilisateur possède des projets
    if (user._count.ownedProjects > 0) {
      return res.status(400).json({
        error: `Cet utilisateur possède ${user._count.ownedProjects} projet(s). Transférez-les avant la suppression.`
      });
    }

    await prisma.$transaction([
      // Supprimer les participations aux projets
      prisma.projectMember.deleteMany({ where: { userId: id } }),
      // Supprimer les notifications
      prisma.notification.deleteMany({ where: { userId: id } }),
      // Supprimer les tokens de reset
      prisma.passwordResetToken.deleteMany({ where: { userId: id } }),
      // Supprimer l'utilisateur
      prisma.user.delete({ where: { id } }),
      // Log l'action
      prisma.auditLog.create({
        data: {
          action: 'DELETE',
          entityType: 'User',
          entityId: id,
          userId: req.user!.id,
          changes: JSON.stringify({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
          })
        }
      })
    ]);

    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' });
  }
});

// POST /api/admin/users/:id/reset-password - Forcer reset MDP
router.post('/users/:id/reset-password', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Invalider les anciens tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: id, used: false },
      data: { used: true }
    });

    // Créer un nouveau token (expire dans 24h pour un reset admin)
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: id,
        expiresAt
      }
    });

    // Envoyer l'email
    await sendPasswordResetEmail(user.email, user.firstName, token);

    // Log l'action
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'User',
        entityId: id,
        userId: req.user!.id,
        changes: JSON.stringify({
          action: 'admin_password_reset_requested',
          targetEmail: user.email
        })
      }
    });

    res.json({ message: 'Un email de réinitialisation a été envoyé à l\'utilisateur' });
  } catch (error) {
    console.error('Force password reset error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du lien de réinitialisation' });
  }
});

// ============ STATISTIQUES ============

// GET /api/admin/stats - Statistiques globales
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const [
      totalUsers,
      usersByRole,
      totalProjects,
      projectsByStatus,
      totalTools,
      toolsByStatus,
      pendingRequests,
      recentActivity
    ] = await Promise.all([
      // Total utilisateurs
      prisma.user.count(),

      // Utilisateurs par rôle
      prisma.user.groupBy({
        by: ['role'],
        _count: { id: true }
      }),

      // Total projets
      prisma.project.count(),

      // Projets par statut
      prisma.project.groupBy({
        by: ['status'],
        _count: { id: true }
      }),

      // Total instances d'outils
      prisma.toolInstance.count(),

      // Outils par statut
      prisma.toolInstance.groupBy({
        by: ['status'],
        _count: { id: true }
      }),

      // Demandes d'accès en attente
      prisma.accessRequest.count({
        where: { status: 'PENDING' }
      }),

      // Activité récente (7 derniers jours)
      prisma.auditLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // Statistiques par jour (7 derniers jours)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailyActivity = await prisma.auditLog.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo }
      },
      select: {
        createdAt: true,
        action: true
      }
    });

    // Grouper par jour
    const activityByDay: { [key: string]: number } = {};
    dailyActivity.forEach(log => {
      const day = log.createdAt.toISOString().split('T')[0];
      activityByDay[day] = (activityByDay[day] || 0) + 1;
    });

    res.json({
      users: {
        total: totalUsers,
        byRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = item._count.id;
          return acc;
        }, {} as Record<string, number>)
      },
      projects: {
        total: totalProjects,
        byStatus: projectsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {} as Record<string, number>)
      },
      tools: {
        total: totalTools,
        byStatus: toolsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {} as Record<string, number>)
      },
      accessRequests: {
        pending: pendingRequests
      },
      activity: {
        last7Days: recentActivity,
        byDay: activityByDay
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// ============ LOGS D'AUDIT ============

// GET /api/admin/audit-logs - Logs paginés avec filtres
router.get('/audit-logs', async (req: AuthRequest, res) => {
  try {
    const {
      page = '1',
      limit = '50',
      action,
      entityType,
      userId,
      startDate,
      endDate
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (action && typeof action === 'string') {
      where.action = action;
    }

    if (entityType && typeof entityType === 'string') {
      where.entityType = entityType;
    }

    if (userId && typeof userId === 'string') {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate && typeof startDate === 'string') {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate && typeof endDate === 'string') {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          project: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des logs' });
  }
});

export default router;
