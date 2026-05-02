const crypto = require('crypto');
const Razorpay = require('razorpay');
const orderController = require('./orderController');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const validateCreateOrderRequest = (body) => {
  if (body.amount === undefined || body.amount === null) {
    return { valid: false, error: 'Amount is required' };
  }

  if (typeof body.amount !== 'number' || Number.isNaN(body.amount) || body.amount <= 0) {
    return { valid: false, error: 'Amount must be a positive number' };
  }

  if (!body.receipt || typeof body.receipt !== 'string') {
    return { valid: false, error: 'Receipt is required' };
  }

  return { valid: true };
};

const validateVerificationRequest = (body) => {
  if (!body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
    return { valid: false, error: 'Missing payment verification details' };
  }

  return { valid: true };
};

const createRazorpayOrder = async (req, res) => {
  try {
    const validation = validateCreateOrderRequest(req.body);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    const { amount, receipt, currency = 'INR', notes = {} } = req.body;

    console.log('[create-order] Creating Razorpay order for receipt:', receipt);

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt,
      notes,
    });

    return res.status(200).json({
      success: true,
      orderId: order.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      order,
    });
  } catch (error) {
    console.error('[create-order] Order creation error:', error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to create order',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const validation = validateVerificationRequest(req.body);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customerEmail,
      email,
      customerName,
      items,
      amount,
      currency = 'INR',
      notes = {},
      receipt,
    } = req.body;

    const normalizedOrderId = String(razorpay_order_id).trim();
    const normalizedPaymentId = String(razorpay_payment_id).trim();
    const normalizedSignature = String(razorpay_signature).trim();
    const normalizedReceipt = String(receipt || notes.receipt || normalizedOrderId).trim();

    console.log('[verify-payment] Received verification payload:', {
      razorpay_order_id: normalizedOrderId,
      razorpay_payment_id: normalizedPaymentId,
      razorpay_signature: normalizedSignature,
      receipt: normalizedReceipt,
    });

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${normalizedOrderId}|${normalizedPaymentId}`)
      .digest('hex');

    console.log('[verify-payment] Generated signature:', expectedSignature);

    const receivedSignatureBuffer = Buffer.from(normalizedSignature, 'utf8');
    const expectedSignatureBuffer = Buffer.from(expectedSignature, 'utf8');
    const signaturesMatch =
      receivedSignatureBuffer.length === expectedSignatureBuffer.length &&
      crypto.timingSafeEqual(expectedSignatureBuffer, receivedSignatureBuffer);

    if (!signaturesMatch) {
      console.error('[verify-payment] Signature mismatch for order:', normalizedOrderId);
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature',
      });
    }

    const existingOrder = orderController.findOrderByPaymentReference({
      razorpayOrderId: normalizedOrderId,
      razorpayPaymentId: normalizedPaymentId,
      receipt: normalizedReceipt,
    });

    if (existingOrder) {
      console.log('[verify-payment] Order already verified. Returning existing record for:', normalizedOrderId);
      return res.status(200).json({
        success: true,
        message: 'Payment already verified and order already created',
        backendOrderId: existingOrder.orderId,
        orderId: normalizedOrderId,
        paymentId: normalizedPaymentId,
        order: existingOrder,
      });
    }

    const orderPayload = {
      email: customerEmail || email || notes.customer_email || notes.email,
      customerName: customerName || notes.customer_name || notes.name,
      items: Array.isArray(items) && items.length ? items : notes.items,
      amount: typeof amount === 'number' ? amount : notes.amount,
      currency,
      orderId: normalizedReceipt,
      receipt: normalizedReceipt,
      razorpayOrderId: normalizedOrderId,
      razorpayPaymentId: normalizedPaymentId,
      razorpaySignature: normalizedSignature,
      notes,
    };

    console.log('[verify-payment] Payment verified. Creating order record for:', normalizedOrderId);

    const createdOrder = await orderController.createOrderFromPayload(orderPayload);

    return res.status(200).json({
      success: true,
      message: 'Payment verified and order created',
      backendOrderId: createdOrder.orderId,
      orderId: normalizedOrderId,
      paymentId: normalizedPaymentId,
      order: createdOrder,
    });
  } catch (error) {
    console.error('[verify-payment] Payment verification error:', error);

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Payment verification failed',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.stack,
    });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyPayment,
};
