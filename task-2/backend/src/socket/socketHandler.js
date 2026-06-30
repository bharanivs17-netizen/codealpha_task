const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Track online users
const onlineUsers = new Map(); // userId -> socketId

const setupSocket = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Authentication error'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id username name avatar');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🔌 User connected: ${socket.user.username} (${socket.id})`);

    // Join personal room for notifications
    socket.join(userId);
    onlineUsers.set(userId, socket.id);

    // Broadcast online status to followers
    socket.broadcast.emit('user_online', { userId, username: socket.user.username });

    // Join conversation rooms
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conv_${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conv_${conversationId}`);
    });

    // Typing indicator
    socket.on('typing_start', ({ conversationId, recipientId }) => {
      io.to(recipientId).emit('typing_start', {
        conversationId,
        user: { _id: userId, username: socket.user.username },
      });
    });

    socket.on('typing_stop', ({ conversationId, recipientId }) => {
      io.to(recipientId).emit('typing_stop', { conversationId, userId });
    });

    // Get online users
    socket.on('get_online_users', (userIds) => {
      const onlineList = userIds.filter((id) => onlineUsers.has(id));
      socket.emit('online_users', onlineList);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      console.log(`🔌 User disconnected: ${socket.user.username}`);
      socket.broadcast.emit('user_offline', { userId });
      // Update last seen
      User.findByIdAndUpdate(userId, { lastSeen: new Date() }).exec();
    });
  });

  return io;
};

const getOnlineUsers = () => Array.from(onlineUsers.keys());
const isUserOnline = (userId) => onlineUsers.has(userId.toString());

module.exports = { setupSocket, getOnlineUsers, isUserOnline };
