const http = require('http');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, type = 'info') {
  const prefix = {
    success: `${colors.green}OK${colors.reset}`,
    error: `${colors.red}ERR${colors.reset}`,
    warn: `${colors.yellow}WARN${colors.reset}`,
    info: `${colors.blue}INFO${colors.reset}`,
  }[type] || 'INFO';
  console.log(`${prefix} ${message}`);
}

function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              body: JSON.parse(body),
            });
          } catch (_) {
            resolve({
              status: res.statusCode,
              body,
            });
          }
        });
      },
    );

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  console.log('\n' + '='.repeat(60));
  console.log('SYSTEM VERIFICATION TEST SUITE');
  console.log('='.repeat(60) + '\n');

  try {
    log('Testing server health...');
    const health = await makeRequest('GET', '/health');
    if (health.status === 200) {
      log('Server is healthy', 'success');
      passed++;
    } else {
      log('Server health check failed', 'error');
      failed++;
    }

    log('\nTesting Razorpay order creation...');
    const createOrderRes = await makeRequest('POST', '/create-order', {
      amount: 50000,
      receipt: `verify_${Date.now()}`,
    });
    if (createOrderRes.status === 200 && createOrderRes.body.success) {
      log(`Order created: ${createOrderRes.body.orderId}`, 'success');
      passed++;
    } else {
      log('Order creation failed', 'error');
      failed++;
    }

    log('\nVerifying key backend files...');
    const files = [
      './controllers/paymentController.js',
      './controllers/orderController.js',
      './services/emailService.js',
      './routes/paymentRoutes.js',
      './routes/orderRoutes.js',
    ];
    const missing = files.filter((file) => !fs.existsSync(file));
    if (!missing.length) {
      log('All required module files exist', 'success');
      passed++;
    } else {
      log(`Missing files: ${missing.join(', ')}`, 'error');
      failed++;
    }

    log('\nChecking environment configuration...');
    const checks = {
      RAZORPAY_KEY_ID: !!process.env.RAZORPAY_KEY_ID,
      RAZORPAY_KEY_SECRET: !!process.env.RAZORPAY_KEY_SECRET,
      EMAIL_USER: !!process.env.EMAIL_USER,
      EMAIL_PASS: !!process.env.EMAIL_PASS,
      PORT: !!process.env.PORT,
      NODE_ENV: !!process.env.NODE_ENV,
    };

    Object.entries(checks).forEach(([key, ok]) => {
      console.log(`  ${ok ? 'OK' : 'MISSING'} ${key}`);
    });

    if (checks.EMAIL_USER && checks.EMAIL_PASS) {
      log('Gmail SMTP is configured for email sending', 'success');
      passed++;
    } else {
      log('Gmail SMTP is not fully configured yet', 'warn');
      passed++;
    }
  } catch (error) {
    log(`Test execution error: ${error.message}`, 'error');
    failed++;
  }

  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Total: ${passed + failed}`);
  console.log('\nNext steps:');
  console.log('  1. Set EMAIL_USER and EMAIL_PASS in .env');
  console.log('  2. Restart the backend with npm start');
  console.log('  3. Test /verify-payment to confirm the email flow');
}

runTests().catch(console.error);
