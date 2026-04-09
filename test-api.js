#!/usr/bin/env node

/**
 * Razorpay Backend - API Testing Script
 * 
 * This script tests all API endpoints locally
 * Usage: node test-api.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Make HTTP request
 */
const makeRequest = (method, path, body = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            body: json,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: data,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
};

/**
 * Test helper
 */
const test = async (name, method, path, body = null, expectedStatus = 200) => {
  try {
    console.log(`\n${colors.cyan}→ ${name}${colors.reset}`);
    const response = await makeRequest(method, path, body);

    if (response.statusCode === expectedStatus) {
      console.log(`${colors.green}✓ Status: ${response.statusCode}${colors.reset}`);
      console.log(`${colors.green}✓ Response:${colors.reset}`);
      console.log(JSON.stringify(response.body, null, 2));
      return true;
    } else {
      console.log(`${colors.red}✗ Expected ${expectedStatus}, got ${response.statusCode}${colors.reset}`);
      console.log(JSON.stringify(response.body, null, 2));
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
    return false;
  }
};

/**
 * Run all tests
 */
const runTests = async () => {
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}RAZORPAY BACKEND - API TESTS${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`\n${colors.yellow}Base URL: ${BASE_URL}${colors.reset}`);
  console.log(`${colors.yellow}Make sure server is running: npm start${colors.reset}`);

  const results = [];

  // Test 1: Root endpoint
  results.push(
    await test(
      '1. GET / (Root endpoint)',
      'GET',
      '/',
      null,
      200
    )
  );

  // Test 2: Health endpoint
  results.push(
    await test(
      '2. GET /health (Health check)',
      'GET',
      '/health',
      null,
      200
    )
  );

  // Test 3: Create order - Valid request
  results.push(
    await test(
      '3. POST /create-order (Valid request)',
      'POST',
      '/create-order',
      {
        amount: 50000,
        receipt: `test_order_${Date.now()}`,
        currency: 'INR',
        notes: {
          test: true,
          timestamp: new Date().toISOString(),
        },
      },
      200
    )
  );

  // Test 4: Create order - Missing amount
  results.push(
    await test(
      '4. POST /create-order (Missing amount - should fail)',
      'POST',
      '/create-order',
      {
        receipt: 'test_order',
      },
      400
    )
  );

  // Test 5: Create order - Missing receipt
  results.push(
    await test(
      '5. POST /create-order (Missing receipt - should fail)',
      'POST',
      '/create-order',
      {
        amount: 50000,
      },
      400
    )
  );

  // Test 6: Create order - Invalid amount
  results.push(
    await test(
      '6. POST /create-order (Invalid amount - should fail)',
      'POST',
      '/create-order',
      {
        amount: -1000,
        receipt: 'test_order',
      },
      400
    )
  );

  // Test 7: Verify payment
  results.push(
    await test(
      '7. POST /verify-payment (Verify payment)',
      'POST',
      '/verify-payment',
      {
        razorpay_order_id: 'order_123456789',
        razorpay_payment_id: 'pay_123456789',
        razorpay_signature: 'signature_hash_123',
      },
      200
    )
  );

  // Test 8: Invalid route
  console.log(`\n${colors.cyan}→ 8. GET /invalid (Should return 404)${colors.reset}`);
  try {
    const response = await makeRequest('GET', '/invalid');
    if (response.statusCode === 404) {
      console.log(`${colors.green}✓ Status: ${response.statusCode} (404 as expected)${colors.reset}`);
      console.log(JSON.stringify(response.body, null, 2));
      results.push(true);
    } else {
      console.log(`${colors.red}✗ Expected 404, got ${response.statusCode}${colors.reset}`);
      results.push(false);
    }
  } catch (error) {
    console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
    results.push(false);
  }

  // Summary
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}TEST SUMMARY${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);

  const passedTests = results.filter((r) => r).length;
  const totalTests = results.length;

  console.log(`\n${colors.yellow}Total Tests: ${totalTests}${colors.reset}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${totalTests - passedTests}${colors.reset}`);

  if (passedTests === totalTests) {
    console.log(`\n${colors.green}✓ All tests passed!${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}✗ Some tests failed${colors.reset}`);
    process.exit(1);
  }
};

// Run tests
runTests();
