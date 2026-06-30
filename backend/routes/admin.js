// routes/admin.js
const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const { getAnalytics, getUsers, updateUser, deleteUser } = require('../controllers/adminController');

router.use(protect, adminOnly);   // all admin routes require auth + admin role

router.get('/analytics', getAnalytics);
router.get('/users',     getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

module.exports = router;
