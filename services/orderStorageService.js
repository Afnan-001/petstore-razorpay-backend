const fs = require('fs');
const path = require('path');

const ORDERS_FILE = path.join(__dirname, '../data/orders.json');

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.dirname(ORDERS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Initialize orders file if it doesn't exist
const initializeOrdersFile = () => {
  ensureDataDir();
  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
  }
};

// Read all orders from file
const readOrdersFromFile = () => {
  try {
    initializeOrdersFile();
    const data = fs.readFileSync(ORDERS_FILE, 'utf8');
    return JSON.parse(data) || [];
  } catch (error) {
    console.error('[storage] Error reading orders file:', error.message);
    return [];
  }
};

// Write orders to file
const writeOrdersToFile = (orders) => {
  try {
    ensureDataDir();
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
    return true;
  } catch (error) {
    console.error('[storage] Error writing orders file:', error.message);
    return false;
  }
};

// Save a new order
const saveOrder = (order) => {
  const orders = readOrdersFromFile();
  orders.push(order);
  const success = writeOrdersToFile(orders);
  
  if (success) {
    console.log('[storage] Order saved successfully:', order.orderId);
  } else {
    console.error('[storage] Failed to save order:', order.orderId);
  }
  
  return success;
};

// Find order by payment reference
const findOrderByPaymentReference = ({
  razorpayOrderId,
  razorpayPaymentId,
  receipt,
}) => {
  const orders = readOrdersFromFile();
  return orders.find((order) => {
    if (razorpayPaymentId && order.razorpayPaymentId === razorpayPaymentId) {
      return true;
    }
    if (razorpayOrderId && order.razorpayOrderId === razorpayOrderId) {
      return true;
    }
    if (receipt && order.receipt === receipt) {
      return true;
    }
    return false;
  }) || null;
};

// Find order by ID
const findOrderById = (orderId) => {
  const orders = readOrdersFromFile();
  return orders.find((order) => 
    order.orderId === orderId || order.razorpayOrderId === orderId
  ) || null;
};

// Get all orders
const getAllOrders = () => {
  return readOrdersFromFile();
};

// Get orders for a specific user
const getOrdersByUserId = (userId) => {
  const orders = readOrdersFromFile();
  return orders.filter((order) => order.userId === userId || order.notes?.user_id === userId);
};

// Update order status
const updateOrderStatus = (orderId, status) => {
  const orders = readOrdersFromFile();
  const index = orders.findIndex((order) => order.orderId === orderId);
  
  if (index !== -1) {
    orders[index].status = status;
    orders[index].updatedAt = new Date().toISOString();
    writeOrdersToFile(orders);
    return orders[index];
  }
  
  return null;
};

module.exports = {
  saveOrder,
  findOrderByPaymentReference,
  findOrderById,
  getAllOrders,
  getOrdersByUserId,
  updateOrderStatus,
};
