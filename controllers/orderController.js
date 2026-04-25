const crypto = require('crypto');
const emailService = require('../services/emailService');

const orders = [];

const isValidEmail = (value) => {
  if (typeof value !== 'string') {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
};

const normalizeItems = (items, fallbackAmount) => {
  if (!Array.isArray(items) || items.length === 0) {
    if (typeof fallbackAmount === 'number' && fallbackAmount > 0) {
      return [
        {
          name: 'Order Total',
          quantity: 1,
          price: Number((fallbackAmount / 100).toFixed(2)),
        },
      ];
    }

    return [];
  }

  return items
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => ({
      name: String(item.name || item.title || `Item ${index + 1}`),
      quantity: Number(item.quantity || item.qty || 1),
      // Flutter sends item prices in paise during payment verification.
      price: Number((Number(item.price || item.amount || 0) / 100).toFixed(2)),
    }));
};

const calculateTotal = (items, fallbackAmount) => {
  if (Array.isArray(items) && items.length > 0) {
    return Number(
      items
        .reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0), 0)
        .toFixed(2)
    );
  }

  if (typeof fallbackAmount === 'number' && fallbackAmount > 0) {
    return Number((fallbackAmount / 100).toFixed(2));
  }

  return 0;
};

const buildOrderRecord = (payload) => {
  const email = payload.email || payload.customerEmail || payload.notes?.customer_email || payload.notes?.email;
  const items = normalizeItems(payload.items || payload.notes?.items, payload.amount);
  const totalAmount = calculateTotal(items, payload.amount);
  const orderId = payload.orderId || payload.razorpayOrderId || `ORD-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const paymentMethod = String(payload.paymentMethod || payload.notes?.payment_method || payload.notes?.paymentMethod || 'prepaid').toLowerCase();
  const paymentStatus = payload.paymentStatus || (paymentMethod === 'cod' ? 'pending' : 'paid');

  if (!isValidEmail(email)) {
    const error = new Error('A valid customer email is required to generate and send the invoice');
    error.statusCode = 400;
    throw error;
  }

  if (!items.length) {
    const error = new Error('At least one order item is required to generate the invoice');
    error.statusCode = 400;
    throw error;
  }

  if (totalAmount <= 0) {
    const error = new Error('Order amount must be greater than zero');
    error.statusCode = 400;
    throw error;
  }

  return {
    orderId,
    customerEmail: email.trim(),
    customerName: payload.customerName || payload.notes?.customer_name || payload.notes?.name || 'Valued Customer',
    items,
    totalAmount,
    currency: payload.currency || 'INR',
    orderDate: new Date().toISOString(),
    razorpayOrderId: payload.razorpayOrderId || payload.razorpay_order_id || null,
    razorpayPaymentId: payload.razorpayPaymentId || payload.razorpay_payment_id || null,
    razorpaySignature: payload.razorpaySignature || payload.razorpay_signature || null,
    receipt: payload.receipt || payload.notes?.receipt || null,
    paymentMethod,
    paymentStatus,
    notes: payload.notes || {},
    status: 'confirmed',
  };
};

const createOrderFromPayload = async (payload) => {
  const order = buildOrderRecord(payload);

  console.log('[order] Creating order record:', order.orderId);

  let emailStatus = 'skipped';
  let emailMessageId = null;
  let emailError = null;

  try {
    const emailResult = await emailService.sendOrderEmail({
      id: order.orderId,
      email: order.customerEmail,
      customerName: order.customerName,
      items: order.items,
      totalAmount: order.totalAmount,
      currency: order.currency,
      orderDate: order.orderDate,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
    });
    emailStatus = 'sent';
    emailMessageId =
      emailResult?.messageId ||
      emailResult?.response ||
      null;
    console.log(
      '[order] Confirmation email sent for order:',
      order.orderId,
    );
  } catch (err) {
    emailStatus = 'failed';
    emailError = err.message;
    console.error('Email failed:', err.message);
  }

  const storedOrder = {
    ...order,
    emailStatus,
    emailMessageId,
    emailError,
    invoiceGenerated: false,
    billDeliveredInEmail: true,
  };

  orders.push(storedOrder);

  return storedOrder;
};

const createOrder = async (req, res) => {
  try {
    const createdOrder = await createOrderFromPayload(req.body || {});

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: createdOrder,
    });
  } catch (error) {
    console.error('[order] Order creation error:', error);

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to create order',
    });
  }
};

const listOrders = async (req, res) => {
  return res.status(200).json({
    success: true,
    count: orders.length,
    orders,
  });
};

const getOrderById = async (req, res) => {
  const order = orders.find((item) => item.orderId === req.params.orderId || item.razorpayOrderId === req.params.orderId);

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
};

module.exports = {
  createOrder,
  createOrderFromPayload,
  listOrders,
  getOrderById,
};
