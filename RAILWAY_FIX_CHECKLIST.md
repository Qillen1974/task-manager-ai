# Railway Deployment Fix Checklist

Your Railway build is failing because of missing or incorrect environment variables. Follow this checklist to fix it.

## ✅ Quick Fix Steps

### Step 1: Verify Required Environment Variables in Railway

Go to your Railway project dashboard and ensure these variables are set:

**Essential Variables:**
- [ ] `DATABASE_URL` - PostgreSQL connection string
  - If using Railway PostgreSQL: Should be auto-set, but verify it exists
  - If using external DB: Set to your connection string

- [ ] `ACCESS_TOKEN_SECRET` - Random string (min 32 chars)
  - Example: `your-random-secret-key-at-least-32-chars-long`

- [ ] `REFRESH_TOKEN_SECRET` - Random string (min 32 chars)
  - Example: `your-random-refresh-secret-at-least-32-chars`

- [ ] `NEXT_PUBLIC_APP_URL` - Your Railway app URL
  - Example: `https://task-manager-ai-production.up.railway.app`

- [ ] `NODE_ENV` - Set to `production`

### Step 2: Check if PostgreSQL is Linked

1. Go to Railway dashboard
2. Click your `task-manager-ai` service
3. Go to "Variables" tab
4. Look for `DATABASE_URL`
5. If missing:
   - Click "New"
   - Select "PostgreSQL"
   - It will auto-link and set `DATABASE_URL`

### Step 3: Trigger Redeploy

After adding/updating variables:

**Option A: Force redeploy via GitHub**
```bash
git commit --allow-empty -m "Trigger Railway redeploy"
git push origin main
```

**Option B: Redeploy from Railway dashboard**
1. Go to "Deployments" tab
2. Find the failed deployment
3. Click "Redeploy"

### Step 4: Monitor the Build

1. Go to "Deployments" tab
2. Click the active deployment
3. Watch the logs in real-time
4. Look for "Build succeeded" message
5. Should see "Deployed successfully"

## 🔍 Troubleshooting Common Issues

### Issue: "DATABASE_URL not found"

**Check:**
```
Does DATABASE_URL variable exist in Railway?
Is the connection string valid?
```

**Fix:**
1. Railway Dashboard > Variables
2. Add `DATABASE_URL=postgresql://user:password@host:port/db`
3. Or add PostgreSQL service to auto-generate it

### Issue: "Build takes too long / times out"

**Cause:** First build is slower due to dependencies

**Fix:**
1. Wait for build to complete (can take 5-10 minutes first time)
2. Check if Railway has enough disk space
3. Reduce build size by removing node_modules before deploy

### Issue: "Build fails with cryptography errors"

**Cause:** Missing build dependencies for bcrypt

**Fix:** Railway's Metal builder should handle this. If not:
1. Check logs for specific error
2. Contact Railway support
3. May need higher plan tier

### Issue: "All other environment variables"

**Optional - Only if you want these features:**

```
# For Stripe payments (optional)
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# For PayPal payments (optional)
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_MODE=sandbox

# For Email via Resend (optional)
RESEND_API_KEY=re_...
SMTP_FROM=support@yourdomain.com

# For OpenAI (optional - can add via admin panel later)
# Not needed in environment - configure in Admin > AI Butler
```

## 📋 Environment Variables Checklist

Create this checklist to track what's set:

```
REQUIRED (Must have):
[ ] DATABASE_URL
[ ] ACCESS_TOKEN_SECRET
[ ] REFRESH_TOKEN_SECRET
[ ] NEXT_PUBLIC_APP_URL
[ ] NODE_ENV=production

OPTIONAL (Nice to have):
[ ] STRIPE_PUBLIC_KEY
[ ] STRIPE_SECRET_KEY
[ ] STRIPE_WEBHOOK_SECRET
[ ] PAYPAL_CLIENT_ID
[ ] PAYPAL_CLIENT_SECRET
[ ] PAYPAL_MODE
[ ] RESEND_API_KEY
[ ] SMTP_FROM
```

## 🚀 After Deployment Succeeds

1. ✅ Go to your Railway app URL
2. ✅ Test landing page loads
3. ✅ Try signing up with email
4. ✅ Try logging in
5. ✅ Check admin panel (`/admin`)
6. ✅ Test creating a project
7. ✅ Test chat bubble (💬) works
8. ✅ Test AI Butler responds

## 📞 Getting Help

If deployment still fails:

1. **Check Rails logs**: Go to Deployments > Click failed build > View logs
2. **Look for specific error messages**
3. **Railway Support**: https://railway.app/support
4. **Common issues guide**: See `RAILWAY_DEPLOYMENT.md`

## Quick Reference

### Generate Random Secrets

```bash
# On Linux/Mac:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# On Windows PowerShell:
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### Test Database Connection Locally

```bash
# Test with psql (if installed)
psql "postgresql://user:password@host:port/database"

# Or with Node.js
node -e "require('@prisma/client').PrismaClient()"
```

## ✨ Success Indicators

Build succeeded when you see:

- ✅ "Build finished successfully"
- ✅ "Deployment complete"
- ✅ Green checkmark on deployment
- ✅ App URL is accessible
- ✅ No error logs in final output

---

**Need more help?**

See: `RAILWAY_DEPLOYMENT.md` for complete guide
