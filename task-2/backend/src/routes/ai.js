const express = require('express');
const router = express.Router();
const { generateCaption, generateHashtags, suggestComments, summarizePost, moderateContent } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.post('/caption', protect, generateCaption);
router.post('/hashtags', protect, generateHashtags);
router.post('/comment-suggestions', protect, suggestComments);
router.post('/summarize', protect, summarizePost);
router.post('/moderate', protect, moderateContent);

module.exports = router;
