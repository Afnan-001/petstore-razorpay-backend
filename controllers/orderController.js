const crypto = require('crypto');
const emailService = require('../services/emailService');
const orderStorageService = require('../services/orderStorageService');

// Keep in-memory cache for session but use persistent storage as primary
let ordersCache = [];

const isValidEmail = (value) => {
  if (typeof value !== 'string') {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
};

const normalizeShippingAddress = (payload) => {
  const shipping =
    payload.deliveryAddress ||
    payload.notes?.shipping_address ||
    {};

  const city = String(shipping.city || '').trim();

  return {
    fullName: String(
      shipping.full_name ||
        shipping.fullName ||
        payload.customerName ||
        payload.notes?.customer_name ||
        payload.notes?.name ||
        'Valued Customer',
    ).trim(),
    phone: String(
      shipping.phone ||
        shipping.phoneNumber ||
        payload.phoneNumber ||
        payload.notes?.phone ||
        '',
    ).trim(),
    addressLine1: String(
      shipping.address_line_1 || shipping.addressLine1 || '',
    ).trim(),
    addressLine2: String(
      shipping.address_line_2 || shipping.addressLine2 || '',
    ).trim(),
    city,
    district: String(shipping.district || city).trim(),
    state: String(shipping.state || '').trim(),
    pincode: String(shipping.pincode || '').trim(),
    landmark: String(shipping.landmark || '').trim(),
    label: String(shipping.label || 'Home').trim(),
  };
};

const normalizeItems = (items, fallbackAmount) => {
  if (!Array.isArray(items) || items.length === 0) {
    if (typeof fallbackAmount === 'number' && fallbackAmount > 0) {
      return [
        {
          productId: '',
          productName: 'Order Total',
          imageUrl: '',
          productPrice: Number((fallbackAmount / 100).toFixed(2)),
          originalProductPrice: Number((fallbackAmount / 100).toFixed(2)),
          selectedOptionId: '',
          selectedOptionLabel: '',
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
    .map((item, index) => {
      const rawPrice = Number(
        item.price || item.amount || item.productPrice || 0,
      );
      const normalizedPrice = Number((rawPrice / 100).toFixed(2));

      return {
        productId: String(item.productId || ''),
        productName: String(
          item.productName || item.name || item.title || `Item ${index + 1}`,
        ),
        imageUrl: String(item.imageUrl || ''),
        productPrice: normalizedPrice,
        originalProductPrice:
          item.originalProductPrice == null && item.originalUnitPrice == null
            ? null
            : Number(
                (
                  Number(
                    item.originalProductPrice ||
                      item.originalUnitPrice ||
                      rawPrice,
                  ) / 100
                ).toFixed(2),
              ),
        quantity: Number(item.quantity || item.qty || 1),
        selectedOptionId: String(item.selectedOptionId || ''),
        selectedOptionLabel: String(item.selectedOptionLabel || ''),
        name: String(item.name || item.title || `Item ${index + 1}`),
        // Flutter sends item prices in paise during payment verification.
        price: normalizedPrice,
      };
    });
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
  const userId = payload.userId || payload.notes?.user_id || payload.notes?.userId || null;
  const deliveryAddress = normalizeShippingAddress(payload);
  const orderStatus = payload.orderStatus || 'confirmed';
  const customerName =
    payload.customerName ||
    payload.notes?.customer_name ||
    payload.notes?.name ||
    deliveryAddress.fullName ||
    'Valued Customer';

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

  const nowIso = new Date().toISOString();

  return {
    orderId,
    userId,
    userEmail: email.trim(),
    customerEmail: email.trim(),
    customerName,
    userName: customerName,
    userPhone: deliveryAddress.phone,
    phoneNumber: deliveryAddress.phone,
    deliveryAddress,
    address: deliveryAddress.addressLine1,
    items,
    pricing: {
      subtotal: totalAmount,
      deliveryCharge: 0,
      discount: 0,
      totalAmount,
      productDiscount: 0,
      couponDiscount: 0,
      couponCode:
        payload.notes?.coupon_code ||
        payload.notes?.couponCode ||
        null,
    },
    totalAmount,
    currency: payload.currency || 'INR',
    orderDate: nowIso,
    createdAt: nowIso,
    updatedAt: nowIso,
    razorpayOrderId: payload.razorpayOrderId || payload.razorpay_order_id || null,
    razorpayPaymentId: payload.razorpayPaymentId || payload.razorpay_payment_id || null,
    razorpaySignature: payload.razorpaySignature || payload.razorpay_signature || null,
    receipt: payload.receipt || payload.notes?.receipt || null,
    paymentMethod,
    paymentStatus,
    payment: {
      paymentMethod,
      paymentStatus,
      razorpayPaymentId:
        payload.razorpayPaymentId || payload.razorpay_payment_id || null,
      razorpayOrderId:
        payload.razorpayOrderId || payload.razorpay_order_id || null,
      razorpaySignature:
        payload.razorpaySignature || payload.razorpay_signature || null,
    },
    notes: payload.notes || {},
    orderStatus,
    status: orderStatus,
  };
};

const createOrderFromPayload = async (payload) => {
  const order = buildOrderRecord(payload);

  console.log('[order] Creating order record:', order.orderId);

  let emailStatus = 'skipped';
  let emailMessageId = null;
  let emailError = null;
  let invoiceGenerated = false;
  let billDeliveredInEmail = false;

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
      deliveryAddress: order.deliveryAddress,
    });
    emailStatus = 'sent';
    emailMessageId =
      emailResult?.messageId ||
      emailResult?.response ||
      null;
    invoiceGenerated = emailResult?.invoiceGenerated == true;
    billDeliveredInEmail = emailResult?.invoiceAttached == true;
    console.log(
      '[order] Confirmation email sent for order:',
      order.orderId,
    );
  } catch (err) {
    emailStatus = 'failed';
    emailError = err.message;
    console.error('[order] Email send failed:', err.message);
    // Don't throw - email failure shouldn't block order creation
  }

  const storedOrder = {
    ...order,
    emailStatus,
    emailMessageId,
    emailError,
    invoiceGenerated,
    billDeliveredInEmail,
  };

  // Save to persistent storage
  const savedSuccessfully = orderStorageService.saveOrder(storedOrder);
  
  // Also keep in memory cache for quick access
  ordersCache.push(storedOrder);

  if (!savedSuccessfully) {
    console.warn('[order] Warning: Order stored in memory but failed to save to persistent storage:', order.orderId);
  }

  return storedOrder;
};

const findOrderByPaymentReference = ({
  razorpayOrderId,
  razorpayPaymentId,
  receipt,
}) => {
  // Check persistent storage first
  const order = orderStorageService.findOrderByPaymentReference({
    razorpayOrderId,
    razorpayPaymentId,
    receipt,
  });
  return order || null;
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
  try {
    const orders = orderStorageService.getAllOrders();
    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error('[order] Error listing orders:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve orders',
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = orderStorageService.findOrderById(req.params.orderId);

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
    console.error('[order] Error getting order:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve order',
    });
  }
};

module.exports = {
  createOrder,
  createOrderFromPayload,
  findOrderByPaymentReference,
  listOrders,
  getOrderById,
};
