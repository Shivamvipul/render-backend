const jwt = require('jsonwebtoken');

let ioInstance;
const onlineUsers = new Map(); // userId -> Set of socketIds

const initSocket = (io) => {
  ioInstance = io;

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(); // allow anonymous connections for public event updates
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(); // treat invalid token as anonymous rather than rejecting connection
    }
  });

  io.on('connection', (socket) => {
    if (socket.userId) {
      if (!onlineUsers.has(socket.userId)) onlineUsers.set(socket.userId, new Set());
      onlineUsers.get(socket.userId).add(socket.id);
      socket.join(`user:${socket.userId}`);
    }

    socket.on('join:event', (eventId) => socket.join(`event:${eventId}`));
    socket.on('leave:event', (eventId) => socket.leave(`event:${eventId}`));

    socket.on('disconnect', () => {
      if (socket.userId && onlineUsers.has(socket.userId)) {
        onlineUsers.get(socket.userId).delete(socket.id);
        if (onlineUsers.get(socket.userId).size === 0) onlineUsers.delete(socket.userId);
      }
    });
  });
};

// Emit a notification to a specific user's room (called from controllers/services)
const emitToUser = (userId, event, payload) => {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
};

// Emit an update to everyone watching a given event (e.g. seat count changes)
const emitToEventRoom = (eventId, event, payload) => {
  if (!ioInstance) return;
  ioInstance.to(`event:${eventId}`).emit(event, payload);
};

const broadcast = (event, payload) => {
  if (!ioInstance) return;
  ioInstance.emit(event, payload);
};

module.exports = { initSocket, emitToUser, emitToEventRoom, broadcast };
