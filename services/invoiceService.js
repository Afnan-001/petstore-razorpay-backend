const puppeteer = require('puppeteer');
const invoiceTemplate = require('../templates/invoiceTemplate');

const generateInvoice = async (orderData) => {
  if (!orderData) {
    const error = new Error('Order data is required to generate an invoice');
    error.statusCode = 400;
    throw error;
  }

  console.log('[invoice] Generating invoice for order:', orderData.orderId);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    const html = invoiceTemplate(orderData);

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '24px',
        right: '24px',
        bottom: '24px',
        left: '24px',
      },
    });

    return pdfBuffer;
  } catch (error) {
    console.error('[invoice] PDF generation failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
};

module.exports = {
  generateInvoice,
};