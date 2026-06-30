const express = require('express');
const router = express.Router();
const {
  createPost, getFeed, getTrending, getPost, updatePost, deletePost,
  likePost, addComment, deleteComment, savePost, repost,
  getByHashtag, getUserPosts, searchPosts, getReels,
} = require('../controllers/postController');
const { protect, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.post('/', protect, upload.array('media', 10), createPost);
router.get('/feed', optionalAuth, getFeed);
router.get('/trending', optionalAuth, getTrending);
router.get('/search', optionalAuth, searchPosts);
router.get('/reels', optionalAuth, getReels);
router.get('/hashtag/:tag', optionalAuth, getByHashtag);
router.get('/user/:username', optionalAuth, getUserPosts);
router.get('/:id', optionalAuth, getPost);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);
router.post('/:id/like', protect, likePost);
router.post('/:id/comment', protect, addComment);
router.delete('/:id/comment/:commentId', protect, deleteComment);
router.post('/:id/save', protect, savePost);
router.post('/:id/repost', protect, repost);

module.exports = router;
