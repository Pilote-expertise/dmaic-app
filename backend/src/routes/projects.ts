import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { AuthRequest, projectManagerMiddleware } from '../middleware/auth';

const router = Router();

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
  code: z.string().min(3, 'Le code projet est requis'),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

const updateProjectSchema = createProjectSchema.partial().extend({
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']).optional(),
  currentPhase: z.enum(['DEFINE', 'MEASURE', 'ANALYZE', 'IMPROVE', 'CONTROL']).optional()
});

// GET /api/projects - List all projects (user has access to)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const isAdmin = req.user!.role === 'ADMIN';

    const projects = await prisma.project.findMany({
      where: isAdmin ? {} : {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, avatar: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatar: true }
            }
          }
        },
        tools: {
          select: { status: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Calculate progress for each project
    const projectsWithProgress = projects.map(project => {
      const totalTools = project.tools.length;
      const completedTools = project.tools.filter(t => t.status === 'COMPLETED').length;
      const progress = totalTools > 0 ? Math.round((completedTools / totalTools) * 100) : 0;

      return {
        ...project,
        tools: undefined,
        progress,
        toolsCompleted: completedTools,
        toolsTotal: totalTools
      };
    });

    res.json(projectsWithProgress);
  } catch (error) {
    console.error('List projects error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des projets' });
  }
});

// GET /api/projects/:id - Get project details
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const isAdmin = req.user!.role === 'ADMIN';

    const project = await prisma.project.findFirst({
      where: {
        id,
        ...(isAdmin ? {} : {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } }
          ]
        })
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, avatar: true }
            }
          }
        },
        tools: {
          include: {
            toolDefinition: true
          },
          orderBy: [
            { phase: 'asc' },
            { toolDefinition: { order: 'asc' } }
          ]
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    // Calculate phase progress
    const phases = ['DEFINE', 'MEASURE', 'ANALYZE', 'IMPROVE', 'CONTROL'];
    const phaseProgress = phases.map(phase => {
      const phaseTools = project.tools.filter(t => t.phase === phase);
      const completed = phaseTools.filter(t => t.status === 'COMPLETED').length;
      return {
        phase,
        total: phaseTools.length,
        completed,
        progress: phaseTools.length > 0 ? Math.round((completed / phaseTools.length) * 100) : 0
      };
    });

    res.json({
      ...project,
      phaseProgress
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du projet' });
  }
});

// POST /api/projects - Create project
router.post('/', projectManagerMiddleware, async (req: AuthRequest, res) => {
  try {
    const data = createProjectSchema.parse(req.body);
    const userId = req.user!.id;

    // Check if code already exists
    const existing = await prisma.project.findUnique({
      where: { code: data.code }
    });

    if (existing) {
      return res.status(400).json({ error: 'Ce code projet existe déjà' });
    }

    // Get all obligatory tool definitions
    const toolDefinitions = await prisma.toolDefinition.findMany({
      where: { priority: 'OBLIGATORY' }
    });

    // Create project with tool instances
    const project = await prisma.project.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        ownerId: userId,
        tools: {
          create: toolDefinitions.map(def => ({
            phase: def.phase,
            toolDefinitionId: def.id,
            status: 'NOT_STARTED',
            data: '{}'
          }))
        }
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true }
        },
        tools: {
          include: { toolDefinition: true }
        }
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'Project',
        entityId: project.id,
        userId,
        projectId: project.id
      }
    });

    res.status(201).json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du projet' });
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = updateProjectSchema.parse(req.body);
    const userId = req.user!.id;

    // Check permissions
    const project = await prisma.project.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          { members: { some: { userId, role: 'EDITOR' } } }
        ]
      }
    });

    if (!project && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Vous n\'avez pas les droits pour modifier ce projet' });
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'Project',
        entityId: id,
        changes: JSON.stringify(data),
        userId,
        projectId: id
      }
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du projet' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check ownership
    const project = await prisma.project.findFirst({
      where: { id, ownerId: userId }
    });

    if (!project && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Seul le propriétaire peut supprimer le projet' });
    }

    await prisma.project.delete({ where: { id } });

    res.json({ message: 'Projet supprimé' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du projet' });
  }
});

// POST /api/projects/:id/members - Add member
router.post('/:id/members', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { userId: newUserId, role = 'VIEWER' } = req.body;

    const member = await prisma.projectMember.create({
      data: {
        projectId: id,
        userId: newUserId,
        role
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true }
        }
      }
    });

    res.status(201).json(member);
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout du membre' });
  }
});

// DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', async (req: AuthRequest, res) => {
  try {
    const { id, userId } = req.params;

    await prisma.projectMember.delete({
      where: {
        projectId_userId: { projectId: id, userId }
      }
    });

    res.json({ message: 'Membre retiré' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Erreur lors du retrait du membre' });
  }
});

export default router;
