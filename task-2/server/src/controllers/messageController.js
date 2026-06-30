const { Message, Conversation } = require('../models/Message');
const { uploadToCloudinary } = require('../middleware/upload');

// @route GET /api/messages/conversations
exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .sort({ lastMessageAt: -1 })
      .populate('participants', 'username name avatar isVerified lastSeen')
      .populate('lastMessage');

    res.json({ success: true, conversations });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/messages/conversations
exports.createOrGetConversation = async (req, res, next) => {
  try {
    const { participantId } = req.body;
    if (!participantId) return res.status(400).json({ success: false, message: 'Participant ID required.' });

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, participantId] },
      isGroup: false,
    }).populate('participants', 'username name avatar isVerified lastSeen');

    if (!conversation) {
      conversation = await Conversation.create({ participants: [req.user._id, participantId] });
      await conversation.populate('participants', 'username name avatar isVerified lastSeen');
    }

    res.json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/messages/:conversationId
exports.getMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found.' });

    if (!conversation.participants.includes(req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const messages = await Message.find({
      conversation: req.params.conversationId,
      deletedFor: { $ne: req.user._id },
    })
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('sender', 'username name avatar')
      .populate('replyTo');

    // Mark messages as read
    await Message.updateMany(
      { conversation: req.params.conversationId, sender: { $ne: req.user._id }, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    res.json({ success: true, messages: messages.reverse(), hasMore: messages.length === Number(limit) });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/messages/:conversationId
exports.sendMessage = async (req, res, next) => {
  try {
    const { content, messageType, replyToId } = req.body;
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found.' });

    let media;
    if (req.file) {
      const isAudio = req.file.mimetype.startsWith('audio/');
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'novasphere/messages',
        resource_type: isAudio ? 'video' : 'auto', // Cloudinary uses 'video' for audio
      });
      media = { url: result.secure_url, publicId: result.public_id };
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      content: content || '',
      messageType: messageType || 'text',
      media,
      readBy: [req.user._id],
      replyTo: replyToId || undefined,
    });

    await message.populate('sender', 'username name avatar');
    if (replyToId) await message.populate('replyTo');

    // Update conversation last message
    conversation.lastMessage = message._id;
    conversation.lastMessageText = content || '📎 Attachment';
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Emit to conversation participants via socket
    if (req.io) {
      conversation.participants.forEach((participantId) => {
        if (participantId.toString() !== req.user._id.toString()) {
          req.io.to(participantId.toString()).emit('new_message', {
            conversationId: conversation._id,
            message,
          });
        }
      });
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/messages/:messageId
exports.deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found.' });
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    message.deletedFor.push(req.user._id);
    await message.save();
    res.json({ success: true, message: 'Message deleted.' });
  } catch (error) {
    next(error);
  }
};
