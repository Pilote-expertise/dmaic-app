import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';
import { Server } from 'socket.io';

const router = Router();

// GET /api/tools/definitions - Get all tool definitions
router.get('/definitions', async (req, res) => {
  try {
    const definitions = await prisma.toolDefinition.findMany({
      orderBy: [
        { phase: 'asc' },
        { order: 'asc' }
      ]
    });

    // Group by phase
    const grouped = definitions.reduce((acc, def) => {
      if (!acc[def.phase]) {
        acc[def.phase] = [];
      }
      acc[def.phase].push(def);
      return acc;
    }, {} as Record<string, typeof definitions>);

    res.json({
      definitions,
      byPhase: grouped
    });
  } catch (error) {
    console.error('Get tool definitions error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des définitions' });
  }
});

// GET /api/tools/definitions/:code - Get single tool definition
router.get('/definitions/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const definition = await prisma.toolDefinition.findUnique({
      where: { code }
    });

    if (!definition) {
      return res.status(404).json({ error: 'Outil non trouvé' });
    }

    res.json(definition);
  } catch (error) {
    console.error('Get tool definition error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la définition' });
  }
});

// GET /api/projects/:projectId/tools - Get all tools for a project
router.get('/project/:projectId', async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;

    const tools = await prisma.toolInstance.findMany({
      where: { projectId },
      include: {
        toolDefinition: true
      },
      orderBy: [
        { phase: 'asc' },
        { toolDefinition: { order: 'asc' } }
      ]
    });

    // Group by phase
    const byPhase = tools.reduce((acc, tool) => {
      if (!acc[tool.phase]) {
        acc[tool.phase] = [];
      }
      acc[tool.phase].push(tool);
      return acc;
    }, {} as Record<string, typeof tools>);

    res.json({
      tools,
      byPhase
    });
  } catch (error) {
    console.error('Get project tools error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des outils' });
  }
});

// GET /api/projects/:projectId/tools/:toolId - Get single tool instance
router.get('/project/:projectId/tool/:toolId', async (req: AuthRequest, res) => {
  try {
    const { projectId, toolId } = req.params;

    const tool = await prisma.toolInstance.findFirst({
      where: {
        id: toolId,
        projectId
      },
      include: {
        toolDefinition: true,
        versions: {
          orderBy: { version: 'desc' },
          take: 10,
          include: {
            createdBy: {
              select: { id: true, firstName: true, lastName: true }
            }
          }
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatar: true }
            }
          }
        }
      }
    });

    if (!tool) {
      return res.status(404).json({ error: 'Outil non trouvé' });
    }

    // Get inherited data from previous phases if applicable
    let inheritedData = null;
    if (tool.toolDefinition) {
      const previousInstance = await prisma.toolInstance.findFirst({
        where: {
          projectId,
          toolDefinitionId: tool.toolDefinitionId,
          phase: { not: tool.phase }
        },
        orderBy: { updatedAt: 'desc' }
      });

      if (previousInstance) {
        const parsedData = JSON.parse(previousInstance.data);
        if (Object.keys(parsedData).length > 0) {
          inheritedData = parsedData;
        }
      }
    }

    res.json({
      ...tool,
      inheritedData
    });
  } catch (error) {
    console.error('Get tool error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'outil' });
  }
});

// PUT /api/projects/:projectId/tools/:toolId - Update tool data
router.put('/project/:projectId/tool/:toolId', async (req: AuthRequest, res) => {
  try {
    const { projectId, toolId } = req.params;
    const { data, status } = req.body;
    const userId = req.user!.id;
    const io = req.app.get('io') as Server;

    // Get current tool
    const current = await prisma.toolInstance.findFirst({
      where: { id: toolId, projectId }
    });

    if (!current) {
      return res.status(404).json({ error: 'Outil non trouvé' });
    }

    // Create version before updating
    await prisma.toolVersion.create({
      data: {
        toolInstanceId: toolId,
        version: current.version,
        data: current.data,
        createdById: userId
      }
    });

    // Update tool
    const updated = await prisma.toolInstance.update({
      where: { id: toolId },
      data: {
        data: data ? JSON.stringify(data) : current.data,
        status: status ?? current.status,
        version: { increment: 1 },
        completedAt: status === 'COMPLETED' ? new Date() : current.completedAt
      },
      include: {
        toolDefinition: true
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'ToolInstance',
        entityId: toolId,
        changes: JSON.stringify({ data, status }),
        userId,
        projectId
      }
    });

    // Emit real-time update
    io.to(`project:${projectId}`).emit('tool-updated', {
      toolId,
      projectId,
      data: updated.data,
      status: updated.status,
      updatedBy: userId
    });

    res.json(updated);
  } catch (error) {
    console.error('Update tool error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'outil' });
  }
});

// POST /api/projects/:projectId/tools/:toolId/comment - Add comment
router.post('/project/:projectId/tool/:toolId/comment', async (req: AuthRequest, res) => {
  try {
    const { projectId, toolId } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;

    const comment = await prisma.comment.create({
      data: {
        content,
        userId,
        projectId,
        toolInstanceId: toolId
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true }
        }
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout du commentaire' });
  }
});

// GET /api/projects/:projectId/tools/:toolId/versions - Get version history
router.get('/project/:projectId/tool/:toolId/versions', async (req: AuthRequest, res) => {
  try {
    const { toolId } = req.params;

    const versions = await prisma.toolVersion.findMany({
      where: { toolInstanceId: toolId },
      orderBy: { version: 'desc' },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    res.json(versions);
  } catch (error) {
    console.error('Get versions error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
  }
});

// POST /api/projects/:projectId/tools/add - Add optional tool to project
router.post('/project/:projectId/add', async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;
    const { toolDefinitionCode, phase } = req.body;

    const definition = await prisma.toolDefinition.findUnique({
      where: { code: toolDefinitionCode }
    });

    if (!definition) {
      return res.status(404).json({ error: 'Définition d\'outil non trouvée' });
    }

    const tool = await prisma.toolInstance.create({
      data: {
        projectId,
        toolDefinitionId: definition.id,
        phase: phase || definition.phase,
        status: 'NOT_STARTED',
        data: '{}'
      },
      include: {
        toolDefinition: true
      }
    });

    res.status(201).json(tool);
  } catch (error) {
    console.error('Add tool error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'outil' });
  }
});

// POST /api/tools/instance - Create a new tool instance
router.post('/instance', async (req: AuthRequest, res) => {
  try {
    const { projectId, toolDefinitionId, data } = req.body;
    const userId = req.user!.id;
    const io = req.app.get('io') as Server;

    // Get the tool definition to determine the phase
    const definition = await prisma.toolDefinition.findUnique({
      where: { id: toolDefinitionId }
    });

    if (!definition) {
      return res.status(404).json({ error: 'Définition d\'outil non trouvée' });
    }

    const tool = await prisma.toolInstance.create({
      data: {
        projectId,
        toolDefinitionId,
        phase: definition.phase,
        status: 'IN_PROGRESS',
        data: JSON.stringify(data || {}),
        version: 1
      },
      include: {
        toolDefinition: true
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'ToolInstance',
        entityId: tool.id,
        changes: JSON.stringify({ data }),
        userId,
        projectId
      }
    });

    // Emit real-time update
    io.to(`project:${projectId}`).emit('tool-created', {
      toolId: tool.id,
      projectId,
      toolDefinitionId
    });

    res.status(201).json(tool);
  } catch (error) {
    console.error('Create tool instance error:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'outil' });
  }
});

// PUT /api/tools/instance/:toolId - Update tool instance by ID
router.put('/instance/:toolId', async (req: AuthRequest, res) => {
  try {
    const { toolId } = req.params;
    const { data, status } = req.body;
    const userId = req.user!.id;
    const io = req.app.get('io') as Server;

    // Get current tool
    const current = await prisma.toolInstance.findUnique({
      where: { id: toolId }
    });

    if (!current) {
      return res.status(404).json({ error: 'Outil non trouvé' });
    }

    // Create version before updating
    await prisma.toolVersion.create({
      data: {
        toolInstanceId: toolId,
        version: current.version,
        data: current.data,
        createdById: userId
      }
    });

    // Update tool
    const updated = await prisma.toolInstance.update({
      where: { id: toolId },
      data: {
        data: data ? JSON.stringify(data) : current.data,
        status: status ?? current.status,
        version: { increment: 1 },
        completedAt: status === 'COMPLETED' ? new Date() : current.completedAt
      },
      include: {
        toolDefinition: true
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'ToolInstance',
        entityId: toolId,
        changes: JSON.stringify({ data, status }),
        userId,
        projectId: current.projectId
      }
    });

    // Emit real-time update
    io.to(`project:${current.projectId}`).emit('tool-updated', {
      toolId,
      projectId: current.projectId,
      data: updated.data,
      status: updated.status,
      updatedBy: userId
    });

    res.json(updated);
  } catch (error) {
    console.error('Update tool instance error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'outil' });
  }
});

export default router;
