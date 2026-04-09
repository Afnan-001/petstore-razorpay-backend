require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Razorpay = require('razorpay');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Validation helper
const validateCreateOrderRequest = (body) => {
  if (!body.amount) {
    return { valid: false, error: 'Amount is required' };
  }
  if (typeof body.amount !== 'number' || body.amount <= 0) {
    return { valid: false, error: 'Amount must be a positive number' };
  }
  if (!body.receipt) {
    return { valid: false, error: 'Receipt is required' };
  }
  return { valid: true };
};

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Razorpay Backend Running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Create Razorpay Order
app.post('/create-order', async (req, res) => {
  try {
    // Validate request body
    const validation = validateCreateOrderRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    const { amount, receipt, currency = 'INR', notes = {} } = req.body;

    // Create order with Razorpay
    const orderOptions = {
      amount: amount, // Amount in paise (smallest unit)
      currency: currency,
      receipt: receipt,
      notes: notes,
    };

    const order = await razorpay.orders.create(orderOptions);

    // Return the order identifier in the Flutter-compatible format.
    return res.status(200).json({
      id: order.id,
    });
  } catch (error) {
    console.error('Order creation error:', error.message);

    // Handle Razorpay specific errors
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    }

    // Handle other errors
    return res.status(500).json({
      success: false,
      error: 'Failed to create order',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    });
  }
});

// Verify Payment (optional but recommended)
app.post('/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing payment verification details',
      });
    }

    // In production, verify the signature using crypto
    // For now, just return success if data is present
    return res.status(200).json({
      success: true,
      message: 'Payment verified',
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });
  } catch (error) {
    console.error('Payment verification error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Payment verification failed',
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Razorpay Backend Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ Razorpay initialized with Key ID: ${process.env.RAZORPAY_KEY_ID?.substring(0, 10)}...`);
});

module.exports = app;
