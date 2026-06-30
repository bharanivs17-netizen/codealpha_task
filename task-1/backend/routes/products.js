// routes/products.js — Product routes (public + admin)
const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getProducts, getProduct, createProduct, updateProduct,
  deleteProduct, addReview, getRelated,
} = require('../controllers/productController');

router.get('/',           getProducts);
router.get('/:slug',      getProduct);
router.get('/:id/related', getRelated);

router.post('/',     protect, adminOnly, upload.array('images', 10), createProduct);
router.put('/:id',   protect, adminOnly, upload.array('images', 10), updateProduct);
router.delete('/:id',protect, adminOnly, deleteProduct);

router.post('/:id/reviews', protect, upload.array('images', 5), addReview);

module.exports = router;
