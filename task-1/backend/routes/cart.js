// routes/cart.js
const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { getCart, addToCart, updateCart, removeFromCart, clearCart } = require('../controllers/cartController');

router.use(protect);   // all cart routes require auth

router.get('/',                   getCart);
router.post('/add',               addToCart);
router.put('/update',             updateCart);
router.delete('/remove/:productId', removeFromCart);
router.delete('/clear',           clearCart);

module.exports = router;
