const express = require('express');
const router = express.Router();
const {
  getConversations, createOrGetConversation, getMessages, sendMessage, deleteMessage,
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.get('/conversations', protect, getConversations);
router.post('/conversations', protect, createOrGetConversation);
router.get('/:conversationId', protect, getMessages);
router.post('/:conversationId', protect, upload.single('media'), sendMessage);
router.delete('/:messageId', protect, deleteMessage);

module.exports = router;
