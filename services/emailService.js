const nodemailer = require('nodemailer');

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatCurrency = (amount, currency = 'INR') => {
  const value = Number(amount || 0);

  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch (error) {
    return `${currency} ${value.toFixed(2)}`;
  }
};

const buildItemsTable = (items, currency) =>
  items
    .map((item, index) => {
      const quantity = Number(item.quantity || 1);
      const price = Number(item.price || 0);
      const lineTotal = quantity * price;

      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(item.name)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${formatCurrency(price, currency)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${formatCurrency(lineTotal, currency)}</td>
        </tr>
      `;
    })
    .join('');

const sendOrderEmail = async (order) => {
  if (!emailUser || !emailPass) {
    const error = new Error('EMAIL_USER and EMAIL_PASS must be configured');
    error.statusCode = 500;
    throw error;
  }

  if (!order?.email) {
    const error = new Error('Customer email is required for order confirmation');
    error.statusCode = 400;
    throw error;
  }

  const items = Array.isArray(order.items) ? order.items : [];
  if (!items.length) {
    const error = new Error('At least one order item is required to send the bill');
    error.statusCode = 400;
    throw error;
  }

  console.log('[email] Sending order confirmation email to:', order.email);

  const billingCurrency = order.currency || 'INR';
  const formattedOrderDate = new Date(
    order.orderDate || Date.now(),
  ).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const itemsTable = buildItemsTable(items, billingCurrency);
  const formattedTotal = formatCurrency(order.totalAmount, billingCurrency);

  const mailOptions = {
    from: emailUser,
    to: order.email,
    subject: 'Order Confirmed 🐾',
    html: `
      <div style="font-family: Arial, sans-serif; background: #f6f8fb; padding: 24px; color: #1f2937;">
        <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
          <div style="background: linear-gradient(135deg, #111827, #374151); color: #ffffff; padding: 28px 32px;">
            <h2 style="margin: 0; font-size: 26px; line-height: 1.2;">Order Confirmed</h2>
            <p style="margin: 10px 0 0; color: #d1d5db;">Your order has been placed successfully.</p>
          </div>
          <div style="padding: 32px;">
            <p style="margin: 0 0 16px; font-size: 16px;">Hi ${escapeHtml(order.customerName || 'there')},</p>
            <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.7; color: #4b5563;">
              Thank you for shopping with us. Your payment was received successfully.
            </p>
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px 18px; margin: 24px 0;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">Order ID</p>
              <p style="margin: 6px 0 0; font-size: 18px; font-weight: 700; color: #111827;">${escapeHtml(order.id)}</p>
              <p style="margin: 12px 0 0; font-size: 14px; color: #6b7280;">Order Date</p>
              <p style="margin: 6px 0 0; font-size: 15px; color: #111827;">${escapeHtml(formattedOrderDate)}</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin: 24px 0; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
              <thead>
                <tr style="background: #111827; color: #ffffff; text-align: left;">
                  <th style="padding: 12px;">#</th>
                  <th style="padding: 12px;">Item</th>
                  <th style="padding: 12px;">Qty</th>
                  <th style="padding: 12px;">Price</th>
                  <th style="padding: 12px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsTable}
              </tbody>
            </table>
            <div style="display: flex; justify-content: flex-end; margin: 24px 0;">
              <div style="min-width: 240px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px 18px;">
                <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; color: #111827;">
                  <span>Total Amount</span>
                  <span>${formattedTotal}</span>
                </div>
              </div>
            </div>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              Please keep this email for your records.
            </p>
          </div>
        </div>
      </div>
    `,
  };

  const result = await transporter.sendMail(mailOptions);
  console.log('[email] Nodemailer response:', JSON.stringify(result));
  return result;
};

module.exports = {
  sendOrderEmail,
};
