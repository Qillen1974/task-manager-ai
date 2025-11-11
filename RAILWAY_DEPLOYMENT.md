# Railway Deployment Guide

This guide explains how to deploy TaskQuadrant to Railway.

## Prerequisites

- Railway account (https://railway.app)
- GitHub repository with your TaskQuadrant code
- Database (PostgreSQL on Railway or external)
- Environment variables ready

## Step 1: Set Up Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Connect your GitHub account
5. Select the `task-manager-ai` repository
6. Click "Deploy"

## Step 2: Configure Environment Variables

Railway will auto-detect the Next.js project. Now add the required environment variables:

1. In Railway dashboard, go to your project
2. Click "Variables" tab
3. Add the following variables:

### Required Variables

```
DATABASE_URL=postgresql://...          # Your PostgreSQL connection string
ACCESS_TOKEN_SECRET=your_secret_key    # Min 32 characters
REFRESH_TOKEN_SECRET=your_secret_key   # Min 32 characters
NEXT_PUBLIC_APP_URL=https://your-app.railway.app
NODE_ENV=production
```

### Optional - Payment Processing

```
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_MODE=live
```

### Optional - Email (Resend)

```
RESEND_API_KEY=re_...
SMTP_FROM=support@yourdomain.com
```

### Optional - OpenAI (for AI Butler)

```
# Note: You can add this later via the admin panel
# No need to set it here - configure in Admin > AI Butler
```

## Step 3: Deploy Database

### Option A: Using Railway PostgreSQL (Recommended)

1. In your Railway project, click "New"
2. Select "PostgreSQL"
3. Railway will auto-link it to your app
4. The `DATABASE_URL` will be set automatically

### Option B: Using External Database

If you have an existing PostgreSQL database:

1. Get your database connection string
2. In Railway, go to Variables
3. Set `DATABASE_URL` to your connection string

## Step 4: Run Database Migrations

After your app is deployed:

1. Go to Railway dashboard
2. Click your project
3. Go to "Deployments" tab
4. Click the latest deployment
5. View logs

Railway will automatically run `npm run build` which includes:
- `prisma generate` - Generate Prisma client
- `next build` - Build Next.js app
- `prisma db push --skip-generate` - Push schema to database (skips generation on retry)

## Step 5: Verify Deployment

1. Railway will show your app URL (e.g., `https://task-manager-ai-production.up.railway.app`)
2. Go to the URL in your browser
3. Test the landing page
4. Try logging in
5. Check admin panel loads

## Troubleshooting Deployment Failures

### Build Fails with "Cannot find module"

**Cause**: Missing dependency or environment variable needed at build time

**Solution**:
1. Check the build logs in Railway
2. Verify all dependencies in `package.json`
3. Run `npm install` locally and commit `package-lock.json`

```bash
npm install --legacy-peer-deps
git add package-lock.json
git commit -m "Update lock file"
git push
```

### Database Connection Error

**Cause**: DATABASE_URL not set or incorrect

**Solution**:
1. In Railway Variables, verify `DATABASE_URL` is set
2. For Railway PostgreSQL, it's auto-set - restart deploy if missing
3. For external database, test the connection string locally:

```bash
psql "postgresql://user:pass@host:port/db"
```

### OpenAI/API Errors

**Cause**: API keys missing or incorrect

**Solution**:
1. For OpenAI: You can skip this initially - use knowledge base fallback
2. Add keys later via Admin > AI Butler panel
3. No need to set in environment variables

### Port Binding Error

**Cause**: Railway assigns dynamic port via `PORT` env var

**Solution**: The app automatically uses the PORT variable. No changes needed.

### Out of Memory

**Cause**: Railway starter plan has limited memory

**Solution**:
1. Upgrade to higher plan
2. Or optimize build:
   - Remove unnecessary dependencies
   - Enable minification (already enabled)

## Monitoring & Logs

1. In Railway dashboard, click your project
2. Go to "Deployments" tab
3. Click active deployment to view real-time logs
4. Check for errors and warnings

## Redeploying

To redeploy after code changes:

1. Push changes to GitHub
2. Railway automatically detects and redeploys
3. View deployment progress in dashboard

Manual redeploy:
1. Go to Deployments tab
2. Click "Redeploy" on any previous deployment
3. Or push an empty commit: `git commit --allow-empty -m "Force redeploy"`

## Custom Domain

To use your own domain:

1. In Railway dashboard, go to Settings
2. Find "Domains" section
3. Add your custom domain
4. Follow DNS setup instructions
5. Update `NEXT_PUBLIC_APP_URL` to your domain

## Database Backups

Railway PostgreSQL automatically backs up daily. To backup external database:

Use your database provider's backup tools or:

```bash
pg_dump "postgresql://..." > backup.sql
```

## Performance Tips

1. **Use Railway PostgreSQL** for lowest latency
2. **Enable caching** - Already configured with `next-pwa`
3. **Monitor logs** - Check for slow queries
4. **Optimize images** - Use responsive images
5. **Monitor costs** - Check Railway dashboard regularly

## Cost Optimization

- Railway free tier: Limited to ~$5 credit/month
- Production should use paid plan
- PostgreSQL addon: ~$15/month
- Estimated monthly cost: $20-50 depending on usage

## Security Best Practices

1. ✅ Never commit `.env` files
2. ✅ Use strong, unique secrets (min 32 characters)
3. ✅ Rotate secrets regularly
4. ✅ Use HTTPS only (Railway auto-enables)
5. ✅ Keep dependencies updated
6. ✅ Monitor logs for suspicious activity

## Updating the Application

When you update your application:

1. Commit and push to GitHub
2. Railway automatically detects changes
3. Rebuilds and redeploys
4. Takes ~2-5 minutes

To force redeploy:
```bash
git commit --allow-empty -m "Force redeploy"
git push
```

## Support

For Railway-specific issues:
- Railway Docs: https://docs.railway.app
- Railway Support: https://railway.app/support
- Discord Community: https://discord.gg/railway

For TaskQuadrant issues:
- Check application logs in Railway
- Review error messages in browser console
- Check admin panel for configuration

---

**Happy Deploying!** 🚀
