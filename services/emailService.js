const { Resend } = require('resend');

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

const resend = resendApiKey ? new Resend(resendApiKey) : null;

const sendOrderEmail = async ({ email, orderId, pdfBuffer, customerName }) => {
  if (!resend) {
    const error = new Error('RESEND_API_KEY is not configured');
    error.statusCode = 500;
    throw error;
  }

  if (!email) {
    const error = new Error('Customer email is required for order confirmation');
    error.statusCode = 400;
    throw error;
  }

  if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
    const error = new Error('A valid invoice PDF buffer is required');
    error.statusCode = 400;
    throw error;
  }

  console.log('[email] Sending order confirmation email to:', email);

  return resend.emails.send({
    from: resendFromEmail,
    to: [email],
    subject: 'Order Confirmed 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; background: #f6f8fb; padding: 24px; color: #1f2937;">
        <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
          <div style="background: linear-gradient(135deg, #111827, #374151); color: #ffffff; padding: 28px 32px;">
            <h1 style="margin: 0; font-size: 26px; line-height: 1.2;">Order Confirmed</h1>
            <p style="margin: 10px 0 0; color: #d1d5db;">Your payment was successfully verified.</p>
          </div>
          <div style="padding: 32px;">
            <p style="margin: 0 0 16px; font-size: 16px;">Hi ${customerName || 'there'},</p>
            <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.7; color: #4b5563;">
              Thank you for your purchase. Your order has been confirmed and your invoice is attached to this email.
            </p>
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px 18px; margin: 24px 0;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">Order ID</p>
              <p style="margin: 6px 0 0; font-size: 18px; font-weight: 700; color: #111827;">${orderId}</p>
            </div>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              Please keep the attached invoice for your records.
            </p>
          </div>
        </div>
      </div>
    `,
    text: `Hi ${customerName || 'there'},\n\nThank you for your purchase. Your order ${orderId} has been confirmed and the invoice is attached.`,
    attachments: [
      {
        filename: `invoice-${orderId}.pdf`,
        content: pdfBuffer.toString('base64'),
      },
    ],
  });
};

module.exports = {
  sendOrderEmail,
};