# Razorpay Backend - Render Deployment Guide

This guide provides step-by-step instructions to deploy your Razorpay backend on Render.

---

## Prerequisites

- GitHub account
- Render account (https://render.com)
- Razorpay API keys
- Node.js installed locally (for testing)

---

## Step 1: Prepare Your GitHub Repository

### 1.1 Initialize Git Repository

```bash
cd razorpay-backend
git init
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### 1.2 Add Files to Git

```bash
git add .
git commit -m "Initial commit: Razorpay backend setup"
```

### 1.3 Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., `razorpay-backend`)
3. Select "Add .gitignore: Node"
4. Click "Create repository"

### 1.4 Push to GitHub

```bash
git branch -M main
git remote add origin https://github.com/yourusername/razorpay-backend.git
git push -u origin main
```

---

## Step 2: Create Render Account & Connect GitHub

1. Go to https://render.com
2. Click **Sign up** (if not already registered)
3. Choose **Sign up with GitHub**
4. Authorize Render to access your GitHub account
5. Complete setup

---

## Step 3: Deploy to Render

### 3.1 Create New Web Service

1. Go to https://dashboard.render.com
2. Click **New +** button (top-right)
3. Select **Web Service**

### 3.2 Connect Repository

1. Select your GitHub username as the source
2. Search for `razorpay-backend` repository
3. Click **Connect**

### 3.3 Configure Service

Fill in the following details:

| Field | Value |
|-------|-------|
| **Name** | `razorpay-backend` |
| **Environment** | `Node` |
| **Region** | `Singapore` (or closest to your users) |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | `Free` (or `Starter` for production) |

### 3.4 Add Environment Variables

1. Scroll down to **Environment** section
2. Click **Add Environment Variable**
3. Add the following:

```
Key: RAZORPAY_KEY_ID
Value: rzp_test_xxxxxxxxxxxxx

Key: RAZORPAY_KEY_SECRET
Value: xxxxxxxxxxxxxxxxxxxxxx

Key: NODE_ENV
Value: production

Key: PORT
Value: 5000
```

**Important:** Get your Razorpay keys from:
1. https://dashboard.razorpay.com
2. Settings → API Keys
3. Copy **Key ID** and **Key Secret**

### 3.5 Deploy

1. Click **Create Web Service** button
2. Render will start the build process
3. Wait for deployment to complete (2-3 minutes)

---

## Step 4: Verify Deployment

### 4.1 Get Your Deployment URL

After successful deployment:
- Your backend URL will be: `https://razorpay-backend.onrender.com`
- View from **Deploy** tab on Render dashboard

### 4.2 Test Endpoint

```bash
curl https://razorpay-backend.onrender.com/
```

Expected response:
```json
{
  "message": "Razorpay Backend Running",
  "version": "1.0.0",
  "timestamp": "2026-04-09T10:30:45.123Z"
}
```

### 4.3 Test Create Order

```bash
curl -X POST https://razorpay-backend.onrender.com/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "receipt": "test_order_123"
  }'
```

Expected response:
```json
{
  "success": true,
  "order": {
    "id": "order_1234567890",
    "amount": 50000,
    "currency": "INR",
    "receipt": "test_order_123",
    "status": "created",
    ...
  }
}
```

---

## Step 5: Check Logs

Monitor your backend in real-time:

1. Go to Render dashboard
2. Click your service name
3. Go to **Logs** tab
4. View live logs as requests come in

---

## Step 6: Update Flutter App

Update your Flutter app to use the deployed backend:

```dart
class RazorpayService {
  final String baseUrl = 'https://razorpay-backend.onrender.com';
  
  // ... rest of your code
}
```

---

## Troubleshooting

### Build Fails

**Problem:** "npm install failed"

**Solution:**
1. Check `package.json` exists
2. Verify all dependencies are correctly listed
3. View build logs in Render dashboard

### Deployment Stuck

**Problem:** Service is stuck in "Deploying" state

**Solution:**
1. Wait 5 minutes
2. If still stuck, go to Settings → Restart Service
3. Check logs for errors

### 502 Bad Gateway

**Problem:** Getting 502 error when accessing backend

**Solution:**
1. Check environment variables are set correctly
2. Verify Razorpay credentials
3. Check startup logs in Render dashboard
4. Restart service: Settings → Restart Service

### "Cannot find module"

**Problem:** "Cannot find module 'razorpay'"

**Solution:**
1. Ensure all packages are in `package.json`
2. Commit and push code
3. Trigger redeploy from Render dashboard

---

## Continuous Deployment

### Auto-Deploy on Git Push

Render automatically redeploys when you push to GitHub:

```bash
# Make changes
echo "// Updated" >> index.js

# Commit and push
git add .
git commit -m "Update backend"
git push origin main
```

Render will automatically:
1. Pull latest code
2. Run build command
3. Deploy new version
4. Keep your service running

---

## Monitoring

### Check Service Status

- **Dashboard:** https://dashboard.render.com
- **Metrics:** View CPU, Memory, Requests
- **Logs:** Real-time logs available

### Common Issues to Watch

| Issue | Cause | Fix |
|-------|-------|-----|
| High CPU | Heavy processing | Optimize code |
| Memory leaks | Unclosed connections | Check logs |
| Slow requests | Network delay | Check logs |
| 500 errors | Server error | Check Razorpay keys |

---

## Managing API Keys

### Rotate Keys Securely

1. Generate new keys in Razorpay Dashboard
2. Update environment variables on Render:
   - Go to Service Settings
   - Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
   - Render will restart service with new keys
3. Delete old keys from Razorpay Dashboard

---

## Production Best Practices

✅ Use **Starter** plan for production (auto-sleep disabled)
✅ Monitor logs regularly
✅ Rotate API keys quarterly
✅ Enable free SSL/TLS (Render provides it)
✅ Keep dependencies updated

---

## Useful Links

- **Render Dashboard:** https://dashboard.render.com
- **Razorpay Dashboard:** https://dashboard.razorpay.com
- **Render Documentation:** https://render.com/docs
- **Razorpay API Docs:** https://razorpay.com/docs/

---

## Support

For issues:
1. Check Render logs in dashboard
2. Verify environment variables
3. Test locally: `npm start`
4. Check GitHub repo synced with latest code

---

**Last Updated:** April 2026
