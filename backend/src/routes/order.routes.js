const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { protect, authorize } = require('../middleware/auth');

// All order routes require authentication
router.use(protect);

// Buyer routes
router.post('/', authorize('buyer'), orderController.createOrder);
router.get('/my-orders', authorize('buyer'), orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);

// Seller routes
router.get('/seller/orders', authorize('farmer'), orderController.getSellerOrders);
router.put('/:id/status', authorize('farmer'), orderController.updateOrderStatus);

// Common routes
router.post('/:id/cancel', orderController.cancelOrder);

module.exports = router;