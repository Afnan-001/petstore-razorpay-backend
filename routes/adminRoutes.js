const express = require('express');
const adminController = require('../controllers/adminController');

const router = express.Router();

// Admin routes for order management
router.get('/orders', adminController.getAllOrders);
router.get('/orders/stats', adminController.getOrderStats);
router.get('/orders/status/:status', adminController.getOrdersByPaymentStatus);
router.get('/orders/:orderId', adminController.getOrderById);
router.patch('/orders/:orderId', adminController.updateOrderStatus);
router.get('/users/:userId/orders', adminController.getOrdersByUser);

module.exports = router;
