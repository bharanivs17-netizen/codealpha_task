const express = require('express');
const router = express.Router();
const {
  getUsers, banUser, updateRole, deleteUser,
  getPosts, deletePost,
  getReports, reviewReport,
  getAnalytics,
} = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middleware/auth');

router.use(protect, requireAdmin);

// Users
router.get('/users', getUsers);
router.put('/users/:id/ban', banUser);
router.put('/users/:id/role', updateRole);
router.delete('/users/:id', deleteUser);

// Posts
router.get('/posts', getPosts);
router.delete('/posts/:id', deletePost);

// Reports
router.get('/reports', getReports);
router.post('/reports/:id/review', reviewReport);

// Analytics
router.get('/analytics', getAnalytics);

module.exports = router;
