const express = require('express');
const router = express.Router();
const { createStory, getStoriesFeed, viewStory, deleteStory } = require('../controllers/storyController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.post('/', protect, upload.single('media'), createStory);
router.get('/feed', protect, getStoriesFeed);
router.post('/:id/view', protect, viewStory);
router.delete('/:id', protect, deleteStory);

module.exports = router;
