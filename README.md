# Razorpay Backend for Flutter E-Commerce App

A secure, production-ready Node.js Express backend for integrating Razorpay payment gateway with your Flutter e-commerce application.

## Features

- ✅ Secure Razorpay integration
- ✅ CORS enabled for Flutter app
- ✅ Environment variable configuration
- ✅ Error handling & validation
- ✅ Render deployment ready
- ✅ JSON request/response handling
- ✅ Payment verification endpoint

---

## Project Structure

```
razorpay-backend/
├── index.js              # Main application file
├── package.json          # Dependencies and scripts
├── .env                  # Environment variables (DO NOT commit)
├── .env.example          # Example environment file
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

---

## Prerequisites

- Node.js >= 14.0.0
- npm or yarn
- Razorpay account (https://razorpay.com)
- Razorpay API keys (Key ID and Key Secret)

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and add your Razorpay credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxx
PORT=5000
NODE_ENV=development
```

**Get your keys from Razorpay Dashboard:**
1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Go to Settings → API Keys
3. Copy Key ID and Key Secret (keep them secret!)

### 3. Run Locally

```bash
npm start
```

Or with auto-reload (requires nodemon):
```bash
npm run dev
```

Server will run on `http://localhost:5000`

---

## API Endpoints

### 1. Root Route (Health Check)
**GET** `/`

Returns:
```json
{
  "message": "Razorpay Backend Running",
  "version": "1.0.0",
  "timestamp": "2026-04-09T10:30:45.123Z"
}
```

### 2. Health Endpoint
**GET** `/health`

Returns:
```json
{
  "status": "OK"
}
```

### 3. Create Order (Main Endpoint)
**POST** `/create-order`

**Request:**
```json
{
  "amount": 50000,
  "receipt": "order_123",
  "currency": "INR",
  "notes": {
    "customer_id": "12345",
    "product_id": "abc123"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "order": {
    "id": "order_1234567890",
    "amount": 50000,
    "amount_paid": 0,
    "currency": "INR",
    "receipt": "order_123",
    "status": "created",
    "created_at": 1712670645
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Amount is required"
}
```

### 4. Verify Payment
**POST** `/verify-payment`

**Request:**
```json
{
  "razorpay_order_id": "order_1234567890",
  "razorpay_payment_id": "pay_1234567890",
  "razorpay_signature": "signature_hash"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified",
  "orderId": "order_1234567890",
  "paymentId": "pay_1234567890"
}
```

---

## Example API Requests

### Using cURL

```bash
# Root route
curl http://localhost:5000/

# Create order
curl -X POST http://localhost:5000/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "receipt": "order_123",
    "currency": "INR"
  }'

# Verify payment
curl -X POST http://localhost:5000/verify-payment \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "order_1234567890",
    "razorpay_payment_id": "pay_1234567890",
    "razorpay_signature": "signature_hash"
  }'
```

### Using Postman

1. **Create Order**
   - Method: POST
   - URL: `http://localhost:5000/create-order`
   - Body (JSON):
     ```json
     {
       "amount": 50000,
       "receipt": "order_123"
     }
     ```

2. **Verify Payment**
   - Method: POST
   - URL: `http://localhost:5000/verify-payment`
   - Body (JSON):
     ```json
     {
       "razorpay_order_id": "order_xyz",
       "razorpay_payment_id": "pay_xyz",
       "razorpay_signature": "signature_hash"
     }
     ```

---

## Deployment on Render

### Step 1: Prepare Your Code

Ensure your `.gitignore` includes:
```
node_modules
.env
```

### Step 2: Create GitHub Repository

```bash
git init
git add .
git commit -m "Initial commit: Razorpay backend"
git branch -M main
git remote add origin https://github.com/yourusername/razorpay-backend.git
git push -u origin main
```

### Step 3: Deploy on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name:** razorpay-backend
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (or Starter for production)

5. Add Environment Variables:
   - Click **Environment** tab
   - Add:
     ```
     RAZORPAY_KEY_ID=your_key_id
     RAZORPAY_KEY_SECRET=your_key_secret
     NODE_ENV=production
     PORT=5000
     ```

6. Click **Deploy**

### Step 4: Test Deployment

Once deployed, your backend URL will be:
```
https://razorpay-backend.onrender.com
```

Test it:
```bash
curl https://razorpay-backend.onrender.com/
```

---

## Integration with Flutter App

### 1. Add HTTP Package to Flutter

```yaml
dependencies:
  http: ^0.13.5
```

### 2. Create Service Class

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class RazorpayService {
  final String baseUrl = 'https://razorpay-backend.onrender.com';

  Future<Map<String, dynamic>> createOrder({
    required int amount,
    required String receipt,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/create-order'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'amount': amount,
          'receipt': receipt,
          'currency': 'INR',
        }),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to create order');
      }
    } catch (e) {
      throw Exception('Error: $e');
    }
  }
}
```

### 3. Use in Flutter Widget

```dart
final razorpayService = RazorpayService();

final order = await razorpayService.createOrder(
  amount: 50000, // 500 INR in paise
  receipt: 'order_${DateTime.now().millisecondsSinceEpoch}',
);
```

---

## Error Handling

| Error | Status Code | Solution |
|-------|-------------|----------|
| Missing amount | 400 | Provide `amount` in request body |
| Missing receipt | 400 | Provide `receipt` in request body |
| Invalid amount | 400 | Ensure `amount` is a positive number |
| Razorpay error | 500 | Check API keys configuration |
| Connection error | N/A | Verify Razorpay credentials |

---

## Security Best Practices

✅ **Implemented:**
- Environment variables for sensitive data
- CORS configuration
- Input validation
- Error handling
- `.gitignore` for .env files

✅ **Recommendations:**
- Use HTTPS in production (Render provides SSL)
- Rotate API keys periodically
- Monitor API usage in Razorpay Dashboard
- Implement rate limiting for production
- Add request logging for debugging
- Verify signatures in `verify-payment` endpoint

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RAZORPAY_KEY_ID` | Razorpay Key ID | Required |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | Required |
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment mode | development |

---

## Troubleshooting

### "Cannot find module 'razorpay'"
```bash
npm install
```

### "RAZORPAY_KEY_ID is undefined"
- Check `.env` file exists
- Verify credentials are correct
- Restart server after updating `.env`

### "CORS error in Flutter app"
- Backend has CORS enabled
- Ensure backend URL is correct in Flutter
- Check firewall/network settings

### "Deployment fails on Render"
- Check build logs in Render dashboard
- Ensure `package.json` and `index.js` exist
- Verify environment variables are set

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `express` | Web framework |
| `razorpay` | Razorpay SDK |
| `cors` | CORS middleware |
| `dotenv` | Environment variables |
| `nodemon` | Development auto-reload |

---

## License

ISC

---

## Support

For issues:
1. Check Razorpay documentation: https://razorpay.com/docs/
2. Check Express documentation: https://expressjs.com/
3. Review error logs on Render dashboard

---

**Created:** April 2026
**Version:** 1.0.0
