import { Router } from 'express';
import { prisma } from '../index';
import { AuthRequest, adminMiddleware } from '../middleware/auth';

const router = Router();

// GET /api/dashboard/overview - Global dashboard (admin)
router.get('/overview', adminMiddleware, async (req, res) => {
  try {
    // Count projects by status
    const projectsByStatus = await prisma.project.groupBy({
      by: ['status'],
      _count: true
    });

    // Count projects by phase
    const projectsByPhase = await prisma.project.groupBy({
      by: ['currentPhase'],
      _count: true
    });

    // Total users
    const totalUsers = await prisma.user.count();

    // Recent activity
    const recentActivity = await prisma.auditLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { firstName: true, lastName: true }
        },
        project: {
          select: { name: true }
        }
      }
    });

    // Tools completion stats
    const toolStats = await prisma.toolInstance.groupBy({
      by: ['status'],
      _count: true
    });

    res.json({
      projects: {
        byStatus: projectsByStatus,
        byPhase: projectsByPhase,
        total: projectsByStatus.reduce((acc, p) => acc + p._count, 0)
      },
      users: {
        total: totalUsers
      },
      tools: {
        byStatus: toolStats
      },
      recentActivity
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du tableau de bord' });
  }
});

// GET /api/dashboard/project/:id - Project-specific dashboard
router.get('/project/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        tools: {
          include: {
            toolDefinition: {
              select: { name: true, nameFr: true, priority: true, phase: true }
            }
          }
        },
        members: {
          include: {
            user: {
              select: { firstName: true, lastName: true, avatar: true }
            }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    // Calculate phase progress
    const phases = ['DEFINE', 'MEASURE', 'ANALYZE', 'IMPROVE', 'CONTROL'];
    const phaseStats = phases.map(phase => {
      const phaseTools = project.tools.filter(t => t.phase === phase);
      const obligatoryTools = phaseTools.filter(t => t.toolDefinition.priority === 'OBLIGATORY');
      const completedObligatory = obligatoryTools.filter(t => t.status === 'COMPLETED').length;
      const completedAll = phaseTools.filter(t => t.status === 'COMPLETED').length;

      return {
        phase,
        totalTools: phaseTools.length,
        obligatoryTools: obligatoryTools.length,
        completedTools: completedAll,
        completedObligatory,
        progress: phaseTools.length > 0
          ? Math.round((completedAll / phaseTools.length) * 100)
          : 0,
        obligatoryProgress: obligatoryTools.length > 0
          ? Math.round((completedObligatory / obligatoryTools.length) * 100)
          : 100
      };
    });

    // Overall progress
    const totalTools = project.tools.length;
    const completedTools = project.tools.filter(t => t.status === 'COMPLETED').length;
    const inProgressTools = project.tools.filter(t => t.status === 'IN_PROGRESS').length;

    // Recent activity for this project
    const recentActivity = await prisma.auditLog.findMany({
      where: { projectId: id },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { firstName: true, lastName: true, avatar: true }
        }
      }
    });

    res.json({
      project: {
        id: project.id,
        name: project.name,
        code: project.code,
        status: project.status,
        currentPhase: project.currentPhase,
        startDate: project.startDate,
        endDate: project.endDate
      },
      progress: {
        overall: totalTools > 0 ? Math.round((completedTools / totalTools) * 100) : 0,
        completed: completedTools,
        inProgress: inProgressTools,
        notStarted: totalTools - completedTools - inProgressTools,
        total: totalTools
      },
      phaseStats,
      team: project.members.map(m => ({
        ...m.user,
        role: m.role
      })),
      recentActivity
    });
  } catch (error) {
    console.error('Project dashboard error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// GET /api/dashboard/my-stats - User's personal stats
router.get('/my-stats', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    // Projects owned
    const ownedProjects = await prisma.project.count({
      where: { ownerId: userId }
    });

    // Projects contributing to
    const contributingProjects = await prisma.projectMember.count({
      where: { userId }
    });

    // Recent contributions
    const recentContributions = await prisma.auditLog.findMany({
      where: { userId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: { name: true, code: true }
        }
      }
    });

    // Tools completed this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const toolsCompletedThisMonth = await prisma.toolVersion.count({
      where: {
        createdById: userId,
        createdAt: { gte: startOfMonth }
      }
    });

    res.json({
      projects: {
        owned: ownedProjects,
        contributing: contributingProjects,
        total: ownedProjects + contributingProjects
      },
      activity: {
        toolsCompletedThisMonth,
        recentContributions
      }
    });
  } catch (error) {
    console.error('My stats error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

export default router;
