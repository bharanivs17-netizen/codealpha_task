// routes/orders.js
const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  placeOrder, getMyOrders, getOrder, getAllOrders, updateOrderStatus,
} = require('../controllers/orderController');

router.use(protect);

router.post('/',              placeOrder);
router.get('/my-orders',      getMyOrders);
router.get('/:id',            getOrder);

// Admin
router.get('/',               adminOnly, getAllOrders);
router.put('/:id/status',     adminOnly, updateOrderStatus);

module.exports = router;
