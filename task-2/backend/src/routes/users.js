const express = require('express');
const router = express.Router();
const {
  getProfile, updateProfile, followUser, searchUsers,
  getSuggestions, getFollowers, getFollowing, getSavedPosts,
} = require('../controllers/userController');
const { protect, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.get('/search', protect, searchUsers);
router.get('/suggestions', protect, getSuggestions);
router.put('/profile', protect, upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'coverPhoto', maxCount: 1 }]), updateProfile);
router.get('/:username', optionalAuth, getProfile);
router.post('/:id/follow', protect, followUser);
router.get('/:id/followers', protect, getFollowers);
router.get('/:id/following', protect, getFollowing);
router.get('/:username/saved', protect, getSavedPosts);

module.exports = router;
