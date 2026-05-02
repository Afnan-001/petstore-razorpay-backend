const orderStorageService = require('../services/orderStorageService');

// Get all orders for admin
const getAllOrders = async (req, res) => {
  try {
    const orders = orderStorageService.getAllOrders();
    
    // Sort by most recent first
    const sortedOrders = orders.sort((a, b) => {
      const dateA = new Date(a.orderDate || 0);
      const dateB = new Date(b.orderDate || 0);
      return dateB - dateA;
    });

    return res.status(200).json({
      success: true,
      count: sortedOrders.length,
      orders: sortedOrders,
    });
  } catch (error) {
    console.error('[admin] Error fetching orders:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
    });
  }
};

// Get orders by payment status
const getOrdersByPaymentStatus = async (req, res) => {
  try {
    const { status } = req.params; // 'paid' or 'pending'
    const orders = orderStorageService.getAllOrders();
    
    const filteredOrders = orders.filter((order) => 
      order.paymentStatus === status || order.status === status
    ).sort((a, b) => {
      const dateA = new Date(a.orderDate || 0);
      const dateB = new Date(b.orderDate || 0);
      return dateB - dateA;
    });

    return res.status(200).json({
      success: true,
      status,
      count: filteredOrders.length,
      orders: filteredOrders,
    });
  } catch (error) {
    console.error('[admin] Error fetching orders by status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
    });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = orderStorageService.findOrderById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('[admin] Error fetching order:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch order',
    });
  }
};

// Get order statistics
const getOrderStats = async (req, res) => {
  try {
    const orders = orderStorageService.getAllOrders();

    const stats = {
      totalOrders: orders.length,
      paidOrders: orders.filter((o) => o.paymentStatus === 'paid').length,
      codOrders: orders.filter((o) => o.paymentMethod === 'cod').length,
      totalRevenue: orders
        .filter((o) => o.paymentStatus === 'paid')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      emailSent: orders.filter((o) => o.emailStatus === 'sent').length,
      emailFailed: orders.filter((o) => o.emailStatus === 'failed').length,
    };

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('[admin] Error fetching order stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
      });
    }

    const updatedOrder = orderStorageService.updateOrderStatus(orderId, status);

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('[admin] Error updating order status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update order status',
    });
  }
};

// Get orders by user ID
const getOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = orderStorageService.getOrdersByUserId(userId);

    return res.status(200).json({
      success: true,
      userId,
      count: orders.length,
      orders: orders.sort((a, b) => {
        const dateA = new Date(a.orderDate || 0);
        const dateB = new Date(b.orderDate || 0);
        return dateB - dateA;
      }),
    });
  } catch (error) {
    console.error('[admin] Error fetching user orders:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user orders',
    });
  }
};

module.exports = {
  getAllOrders,
  getOrdersByPaymentStatus,
  getOrderById,
  getOrderStats,
  updateOrderStatus,
  getOrdersByUser,
};
