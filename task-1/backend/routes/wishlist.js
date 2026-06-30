// routes/wishlist.js
const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { getWishlist, toggleWishlist } = require('../controllers/wishlistController');

router.use(protect);

router.get('/',        getWishlist);
router.post('/toggle', toggleWishlist);

module.exports = router;
