# TaskMaster - Production Setup Guide

This guide walks you through setting up TaskMaster as a production-ready SaaS platform on a VPS.

## Table of Contents

1. [Database Setup](#database-setup)
2. [Environment Configuration](#environment-configuration)
3. [Payment Integration](#payment-integration)
4. [Deployment](#deployment)
5. [Security](#security)
6. [Monitoring](#monitoring)

## Database Setup

### Option 1: PostgreSQL on VPS (Recommended)

#### 1. Install PostgreSQL

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 2. Create Database and User

```bash
sudo -u postgres psql

# Inside psql:
CREATE DATABASE taskmaster_prod;
CREATE USER taskmaster WITH PASSWORD 'your_secure_password';
ALTER ROLE taskmaster SET client_encoding TO 'utf8';
ALTER ROLE taskmaster SET default_transaction_isolation TO 'read committed';
ALTER ROLE taskmaster SET default_transaction_deferrable TO on;
ALTER ROLE taskmaster SET default_transaction_level TO 'read committed';
GRANT ALL PRIVILEGES ON DATABASE taskmaster_prod TO taskmaster;
\q
```

#### 3. Backup Your Database

```bash
# Daily backup (add to crontab)
0 2 * * * pg_dump -U taskmaster taskmaster_prod > /backups/taskmaster_$(date +\%Y\%m\%d).sql

# Restore from backup
psql -U taskmaster taskmaster_prod < /backups/taskmaster_20240101.sql
```

### Option 2: Managed Database (Easier for Production)

- AWS RDS PostgreSQL
- DigitalOcean Managed Databases
- Heroku Postgres
- MongoDB Atlas (if using MongoDB instead)

**Benefits:**
- Automatic backups
- High availability
- Easy scaling
- Reduced maintenance burden

## Environment Configuration

### 1. Production .env File

Create `/app/.env.production`:

```bash
# Database
DATABASE_URL="postgresql://taskmaster:PASSWORD@localhost:5432/taskmaster_prod"

# JWT Secrets - MUST be strong and unique!
JWT_SECRET="your-128-char-random-string-here"
JWT_REFRESH_SECRET="your-128-char-random-refresh-secret-here"

# Stripe (get from stripe.com dashboard)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_your_publishable_key"
STRIPE_SECRET_KEY="sk_live_your_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_live_your_webhook_secret"

# Application
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NODE_ENV="production"

# Email (for notifications)
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASSWORD="your_sendgrid_api_key"
SMTP_FROM="noreply@yourdomain.com"

# Optional: Monitoring
SENTRY_DSN="your-sentry-dsn"
LOG_LEVEL="info"
```

### 2. Generate Strong Secrets

```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Payment Integration

### Stripe Setup

#### 1. Create Stripe Account

1. Go to https://stripe.com
2. Create account and verify email
3. Navigate to Dashboard → API Keys
4. Copy publishable and secret keys

#### 2. Create Products and Prices

```bash
# In Stripe Dashboard:
# Products → Create Product

# Create subscription tiers:
# - FREE (default, no charge)
# - PRO ($9.99/month)
#   - Unlimited projects
#   - Unlimited tasks
#   - Team collaboration
# - ENTERPRISE (custom pricing)
#   - Everything in Pro
#   - Priority support
#   - Custom integrations
```

#### 3. Webhook Setup

```bash
# In Stripe Dashboard:
# Developers → Webhooks → Add endpoint

# Webhook URL: https://yourdomain.com/api/webhooks/stripe
# Events to listen for:
# - customer.subscription.created
# - customer.subscription.updated
# - customer.subscription.deleted
# - invoice.payment_succeeded
# - invoice.payment_failed
```

#### 4. Test Mode

Use Stripe test cards during development:
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- 3D Secure: 4000 0025 0000 3155

## Deployment

### 1. VPS Setup

**Recommended VPS Provider:**
- DigitalOcean ($6-12/month starting)
- Linode
- Hetzner
- AWS EC2

**Minimum Requirements:**
- 2GB RAM
- 2 CPU cores
- 30GB SSD storage
- Ubuntu 20.04 LTS or newer

### 2. Install Node.js and PM2

```bash
# Install Node.js
curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Verify installation
node --version
npm --version
```

### 3. Clone and Setup Application

```bash
# Clone repository
cd /var/www
git clone https://github.com/yourusername/taskmaster.git
cd taskmaster

# Install dependencies
npm install

# Build application
npm run build

# Create .env.production with values above
nano .env.production

# Run database migrations
npx prisma migrate deploy

# Start with PM2
pm2 start npm --name "taskmaster" -- start
pm2 save
pm2 startup
```

### 4. Nginx Configuration

```bash
# Install Nginx
sudo apt-get install nginx

# Create config file
sudo nano /etc/nginx/sites-available/taskmaster
```

**Nginx Config:**

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (using Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable and Start:**

```bash
sudo ln -s /etc/nginx/sites-available/taskmaster /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. SSL Certificate with Let's Encrypt

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot renew --dry-run  # Test renewal
```

### 6. Firewall Configuration

```bash
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 5432/tcp  # PostgreSQL (if external)
```

## Security

### 1. Database Security

```bash
# Backup database regularly
pg_dump -U taskmaster taskmaster_prod | gzip > backup.sql.gz

# Restrict PostgreSQL access
sudo nano /etc/postgresql/13/main/pg_hba.conf
# Change: local   all             all                                     trust
# To:     local   all             all                                     md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 2. Application Security

**Implement in code:**

```typescript
// Rate limiting on authentication endpoints
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
});

app.post("/api/auth/login", limiter, loginHandler);
app.post("/api/auth/register", limiter, registerHandler);
```

**Environment Variables Security:**

- Never commit .env files
- Use strong secrets (128+ characters)
- Rotate secrets regularly
- Use separate secrets for dev/prod
- Store secrets in secure vault (HashiCorp Vault, AWS Secrets Manager)

### 3. HTTPS/TLS

- Always use HTTPS in production
- Redirect HTTP → HTTPS
- Use strong SSL/TLS settings
- Set HSTS header (Strict-Transport-Security)

### 4. CORS Configuration

```typescript
// In your API routes
const ALLOWED_ORIGINS = [
  "https://yourdomain.com",
  "https://www.yourdomain.com",
];

export function setCorsHeaders(response: Response) {
  response.headers.set(
    "Access-Control-Allow-Origin",
    process.env.NEXT_PUBLIC_APP_URL
  );
  response.headers.set("Access-Control-Allow-Credentials", "true");
  return response;
}
```

## Monitoring

### 1. Application Monitoring

```bash
# Monitor PM2 processes
pm2 monit

# View logs
pm2 logs taskmaster
pm2 logs taskmaster --lines 100
```

### 2. Database Monitoring

```bash
# Monitor PostgreSQL
psql -U taskmaster taskmaster_prod

# Check database size
SELECT datname, pg_size_pretty(pg_database_size(datname))
FROM pg_database
WHERE datname = 'taskmaster_prod';

# Monitor active connections
SELECT * FROM pg_stat_activity;
```

### 3. System Monitoring

```bash
# Install monitoring tools
sudo apt-get install htop iotop nethogs

# Monitor system
htop              # Overall system usage
df -h            # Disk usage
free -h          # Memory usage
```

### 4. Error Tracking (Optional)

Integrate Sentry for error tracking:

```bash
npm install @sentry/nextjs

# Add to next.config.js
const withSentry = require("@sentry/nextjs/withSentry");

module.exports = withSentry({
  sentry: {
    dsn: process.env.SENTRY_DSN,
  },
});
```

### 5. Analytics & Logging

- Implement structured logging
- Track user behavior
- Monitor API performance
- Set up alerts for errors

## Maintenance Checklist

### Daily
- [ ] Check application is running
- [ ] Monitor error logs
- [ ] Verify backups completed

### Weekly
- [ ] Review user signups
- [ ] Check subscription revenue
- [ ] Monitor database size
- [ ] Review error trends

### Monthly
- [ ] Update dependencies
- [ ] Review security logs
- [ ] Test backup restoration
- [ ] Performance optimization
- [ ] User feedback review

### Quarterly
- [ ] Security audit
- [ ] Database optimization
- [ ] Capacity planning
- [ ] Disaster recovery drill

## Scaling

### When You Need to Scale

**Vertical Scaling (recommended first):**
- Increase VPS resources
- Upgrade database tier

**Horizontal Scaling (as you grow):**
- Load balancer (Nginx, HAProxy)
- Multiple app servers
- Database replication
- Redis caching layer

```bash
# Implement Redis caching
npm install redis ioredis
```

## Support & Resources

- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- Stripe Docs: https://stripe.com/docs
- PostgreSQL Docs: https://www.postgresql.org/docs
- Ubuntu Server Guide: https://ubuntu.com/server/docs

---

**Last Updated:** October 2024
**Version:** 1.0

Good luck launching your SaaS! 🚀
