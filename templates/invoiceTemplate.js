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

const invoiceTemplate = (orderData) => {
  const items = Array.isArray(orderData.items) ? orderData.items : [];
  const totalAmount = Number(orderData.totalAmount || 0);
  const currency = orderData.currency || 'INR';
  const orderDate = new Date(orderData.orderDate || Date.now()).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const rows = items
    .map((item, index) => {
      const quantity = Number(item.quantity || 1);
      const price = Number(item.price || 0);
      const lineTotal = quantity * price;

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(item.name)}</td>
          <td>${quantity}</td>
          <td>${formatCurrency(price, currency)}</td>
          <td>${formatCurrency(lineTotal, currency)}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Invoice ${escapeHtml(orderData.orderId)}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
            background: #f3f4f6;
            color: #111827;
          }
          .page {
            max-width: 900px;
            margin: 0 auto;
            background: #ffffff;
            padding: 32px;
            border-radius: 18px;
            border: 1px solid #e5e7eb;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 24px;
            padding-bottom: 24px;
            border-bottom: 2px solid #111827;
            margin-bottom: 24px;
          }
          .brand h1 {
            margin: 0;
            font-size: 28px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .brand p, .meta p {
            margin: 4px 0 0;
            color: #6b7280;
            font-size: 13px;
          }
          .badge {
            display: inline-block;
            padding: 8px 12px;
            border-radius: 999px;
            background: #111827;
            color: #ffffff;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin-bottom: 24px;
          }
          .card {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            padding: 16px 18px;
          }
          .label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #6b7280;
            margin-bottom: 8px;
          }
          .value {
            font-size: 15px;
            font-weight: 700;
            color: #111827;
            word-break: break-word;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            overflow: hidden;
            border-radius: 14px;
            margin-top: 18px;
          }
          thead th {
            background: #111827;
            color: #ffffff;
            text-align: left;
            padding: 14px 12px;
            font-size: 13px;
          }
          tbody td {
            padding: 14px 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 13px;
            vertical-align: top;
          }
          tbody tr:nth-child(even) td {
            background: #fafafa;
          }
          .summary {
            margin-top: 20px;
            display: flex;
            justify-content: flex-end;
          }
          .summary-box {
            min-width: 280px;
            background: linear-gradient(180deg, #f9fafb, #ffffff);
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            padding: 18px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            font-size: 14px;
            color: #374151;
          }
          .summary-row.total {
            border-top: 1px solid #e5e7eb;
            padding-top: 12px;
            margin-top: 12px;
            font-size: 16px;
            font-weight: 700;
            color: #111827;
          }
          .footer {
            margin-top: 28px;
            font-size: 12px;
            color: #6b7280;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <div class="brand">
              <h1>Invoice</h1>
              <p>Professional order summary and payment receipt</p>
            </div>
            <div class="meta" style="text-align:right;">
              <div class="badge">Paid</div>
              <p style="margin-top:10px;">Invoice Date: ${escapeHtml(orderDate)}</p>
              <p>Order ID: ${escapeHtml(orderData.orderId)}</p>
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <div class="label">Customer</div>
              <div class="value">${escapeHtml(orderData.customerName || 'Valued Customer')}</div>
              <div style="margin-top:8px; color:#6b7280; font-size:13px;">${escapeHtml(orderData.customerEmail)}</div>
            </div>
            <div class="card">
              <div class="label">Payment Details</div>
              <div class="value">${escapeHtml(orderData.currency || 'INR')} Transaction</div>
              <div style="margin-top:8px; color:#6b7280; font-size:13px;">Status: Confirmed</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:60px;">#</th>
                <th>Item</th>
                <th style="width:90px;">Qty</th>
                <th style="width:140px;">Price</th>
                <th style="width:140px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-box">
              <div class="summary-row total">
                <span>Total Amount</span>
                <span>${formatCurrency(totalAmount, currency)}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            Thank you for shopping with us. Keep this invoice for your records.
          </div>
        </div>
      </body>
    </html>
  `;
};

module.exports = invoiceTemplate;