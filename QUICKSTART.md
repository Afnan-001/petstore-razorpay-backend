# Razorpay Backend - Quick Start Guide

Get your Razorpay backend up and running in **5 minutes**.

---

## 📋 Prerequisites

- Node.js (v14+) installed
- npm or yarn
- Razorpay account with API keys

---

## 🚀 5-Minute Setup

### Step 1: Install Dependencies (1 min)

```bash
npm install
```

### Step 2: Configure Environment Variables (1 min)

Edit `.env` file:

```bash
# Replace with your actual keys from https://dashboard.razorpay.com
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxx
PORT=5000
NODE_ENV=development
```

### Step 3: Start Server (1 min)

```bash
npm start
```

**Output:**
```
✓ Razorpay Backend Server running on port 5000
✓ Environment: development
✓ Razorpay initialized with Key ID: rzp_test_...
```

### Step 4: Test Root Endpoint (1 min)

```bash
curl http://localhost:5000/
```

**Response:**
```json
{
  "message": "Razorpay Backend Running",
  "version": "1.0.0",
  "timestamp": "2026-04-09T10:30:45.123Z"
}
```

### Step 5: Test Create Order (1 min)

```bash
curl -X POST http://localhost:5000/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "receipt": "order_123"
  }'
```

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "order_1234567890",
    "amount": 50000,
    "currency": "INR",
    "receipt": "order_123",
    "status": "created"
  }
}
```

✅ **Setup complete!**

---

## 📁 Project Files

| File | Purpose |
|------|---------|
| `index.js` | Main server file with all endpoints |
| `package.json` | Dependencies and scripts |
| `.env` | Razorpay credentials (keep secret!) |
| `.env.example` | Example environment template |
| `.gitignore` | Files to exclude from Git |
| `README.md` | Full documentation |
| `DEPLOYMENT.md` | Render deployment guide |
| `test-api.js` | Automated API tests |

---

## 🔑 Get Your Razorpay Keys

1. Go to https://dashboard.razorpay.com
2. Login to your account
3. Navigate to **Settings** → **API Keys**
4. Copy **Key ID** and **Key Secret**
5. Paste into `.env` file

---

## 📱 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Health check |
| `/health` | GET | Quick health status |
| `/create-order` | POST | Create Razorpay order |
| `/verify-payment` | POST | Verify payment |

---

## 🧪 Run Automated Tests

```bash
# Open new terminal while server is running
node test-api.js
```

Tests all endpoints automatically.

---

## 📦 Deploy to Render

1. **Commit code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/username/razorpay-backend.git
   git push -u origin main
   ```

2. **Go to Render Dashboard**
   - https://dashboard.render.com
   - Click **New** → **Web Service**
   - Select your GitHub repo
   - Set environment variables (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
   - Click **Deploy**

3. **Test Deployed Backend**
   ```bash
   curl https://razorpay-backend.onrender.com/
   ```

📖 **Detailed guide:** See `DEPLOYMENT.md`

---

## 🔐 Security Checklist

✅ Keep `.env` file secret (in `.gitignore`)
✅ Never hardcode API keys
✅ Use environment variables
✅ Rotate keys quarterly
✅ Use HTTPS in production (Render provides free SSL)
✅ Enable CORS only for trusted domains

---

## 🐛 Common Issues

### "Cannot find module 'razorpay'"
```bash
npm install
```

### "RAZORPAY_KEY_ID is undefined"
- Check `.env` file exists
- Verify keys are correct
- Restart server

### "Port 5000 already in use"
```bash
# Change port in .env
PORT=3000
```

### API returns 500 error
- Check Razorpay keys are valid
- View server logs
- Ensure Razorpay account is active

---

## 📚 Integration with Flutter

```dart
// In your Flutter app
const String backendUrl = 'http://localhost:5000'; // Local
// const String backendUrl = 'https://razorpay-backend.onrender.com'; // Production

// Create order
final response = await http.post(
  Uri.parse('$backendUrl/create-order'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'amount': 50000,
    'receipt': 'order_123'
  }),
);
```

📖 **Full example:** See `flutter_integration_example.dart`

---

## ✨ Development Commands

```bash
# Start server
npm start

# Start with auto-reload (install nodemon first)
npm run dev

# Test API
node test-api.js

# Check Node version
node --version

# Check npm version
npm --version
```

---

## 📞 Need Help?

1. **Backend issues:** Check logs in terminal
2. **Razorpay issues:** https://razorpay.com/docs/
3. **Deployment issues:** Check Render dashboard logs
4. **Flutter issues:** Check Flutter error logs

---

## 📖 Useful Links

- **Razorpay Dashboard:** https://dashboard.razorpay.com
- **Razorpay Docs:** https://razorpay.com/docs/
- **Express.js Docs:** https://expressjs.com/
- **Render Docs:** https://render.com/docs/
- **Node.js Docs:** https://nodejs.org/docs/

---

## 🎯 What's Next?

1. ✅ Backend setup complete
2. 🔄 Test API endpoints (run `node test-api.js`)
3. 🚀 Deploy to Render (see `DEPLOYMENT.md`)
4. 📱 Integrate with Flutter app
5. 💳 Test payments with Razorpay test cards

---

## Test Razorpay Cards

Use these cards to test payments:

| Card | Number | Expiry | CVV |
|------|--------|--------|-----|
| Visa (Success) | 4111 1111 1111 1111 | 12/25 | 123 |
| Visa (Failed) | 4222 2222 2222 2222 | 12/25 | 123 |

📖 Full list: https://razorpay.com/docs/recurring-payments/test-credentials/

---

**Version:** 1.0.0  
**Last Updated:** April 2026  
**Status:** Production Ready ✅
