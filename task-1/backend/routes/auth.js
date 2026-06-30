// routes/auth.js — Authentication routes
const router = require('express').Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  register, login, getMe, updateProfile,
  addAddress, deleteAddress, changePassword, logout,
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login',    login);
router.post('/logout',   protect, logout);
router.get('/me',        protect, getMe);
router.put('/update-profile', protect, upload.single('avatar'), updateProfile);
router.post('/addresses',       protect, addAddress);
router.delete('/addresses/:id', protect, deleteAddress);
router.put('/change-password',  protect, changePassword);

module.exports = router;
