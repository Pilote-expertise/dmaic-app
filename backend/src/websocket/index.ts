import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dmaic-secret-key-change-in-production';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
}

export const setupWebSocket = (io: Server) => {
  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Token manquant'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
      };
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Token invalide'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join project room
    socket.on('join-project', (projectId: string) => {
      socket.join(`project:${projectId}`);
      console.log(`User ${socket.userId} joined project ${projectId}`);

      // Notify others
      socket.to(`project:${projectId}`).emit('user-joined', {
        userId: socket.userId,
        timestamp: new Date()
      });
    });

    // Leave project room
    socket.on('leave-project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
      console.log(`User ${socket.userId} left project ${projectId}`);

      socket.to(`project:${projectId}`).emit('user-left', {
        userId: socket.userId,
        timestamp: new Date()
      });
    });

    // Tool update (real-time collaboration)
    socket.on('tool-update', (data: {
      projectId: string;
      toolId: string;
      changes: any;
      cursorPosition?: { x: number; y: number };
    }) => {
      // Broadcast to others in the project
      socket.to(`project:${data.projectId}`).emit('tool-updated', {
        ...data,
        userId: socket.userId,
        timestamp: new Date()
      });
    });

    // Cursor position for collaborative editing
    socket.on('cursor-move', (data: {
      projectId: string;
      toolId: string;
      position: { x: number; y: number };
      field?: string;
    }) => {
      socket.to(`project:${data.projectId}`).emit('cursor-update', {
        ...data,
        userId: socket.userId
      });
    });

    // Typing indicator
    socket.on('typing-start', (data: { projectId: string; toolId: string; field: string }) => {
      socket.to(`project:${data.projectId}`).emit('user-typing', {
        ...data,
        userId: socket.userId,
        isTyping: true
      });
    });

    socket.on('typing-stop', (data: { projectId: string; toolId: string; field: string }) => {
      socket.to(`project:${data.projectId}`).emit('user-typing', {
        ...data,
        userId: socket.userId,
        isTyping: false
      });
    });

    // Get connected users in a project
    socket.on('get-connected-users', async (projectId: string) => {
      const sockets = await io.in(`project:${projectId}`).fetchSockets();
      const users = sockets.map(s => (s as unknown as AuthenticatedSocket).userId);
      socket.emit('connected-users', { projectId, users });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });
};
