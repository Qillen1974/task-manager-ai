# TaskMaster - Migration Guide: Demo to Production

This guide explains how to migrate from the current localStorage-based demo to the new PostgreSQL-based production system.

## Overview

The application now has a dual-mode setup:

1. **Demo Mode** (Current) - Uses localStorage, no database
2. **Production Mode** - Uses PostgreSQL with Prisma ORM

## Phase 1: Setting Up PostgreSQL Locally

### Step 1: Install PostgreSQL

**Windows:**
1. Download from https://www.postgresql.org/download/windows/
2. Run installer and remember your password
3. Add PostgreSQL to PATH

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu):**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Step 2: Create Development Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE taskmaster_dev;

# Create user
CREATE USER taskmaster WITH PASSWORD 'taskmaster123';

# Grant privileges
ALTER ROLE taskmaster SET client_encoding TO 'utf8';
ALTER ROLE taskmaster SET default_transaction_isolation TO 'read committed';
GRANT ALL PRIVILEGES ON DATABASE taskmaster_dev TO taskmaster;

# Exit
\q
```

### Step 3: Configure Environment

Update `.env.local`:

```bash
DATABASE_URL="postgresql://taskmaster:taskmaster123@localhost:5432/taskmaster_dev"
JWT_SECRET="your-dev-secret-key"
JWT_REFRESH_SECRET="your-dev-refresh-secret"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### Step 4: Run Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (optional)
npx prisma db seed
```

## Phase 2: Updating the Frontend

### Currently Implemented (Done)

✅ **API Layer** - All backend APIs created
✅ **Authentication** - JWT-based auth implemented
✅ **Database Schema** - PostgreSQL schema designed
✅ **Error Handling** - Comprehensive error handling
✅ **Security** - Password hashing, token validation

### Still Needed (Next Steps)

The following components need to be updated to use the new API instead of localStorage:

```
Frontend Components to Update:
├── lib/useLocalStorage.ts → lib/useApi.ts (new)
├── components/AuthPage.tsx → Update to call new APIs
├── app/page.tsx → Integrate with new API
├── components/TaskForm.tsx → Use API endpoints
├── components/ProjectForm.tsx → Use API endpoints
├── components/TaskCard.tsx → Use API endpoints
├── components/EisenhowerMatrix.tsx → Fetch from API
└── Other components → Update as needed
```

## Phase 3: Creating the API Client Hook

Here's the new `lib/useApi.ts` that will replace `useLocalStorage`:

```typescript
// TO BE CREATED: lib/useApi.ts
// This will handle all API calls with:
// - Automatic token management
// - Token refresh on expiry
// - Error handling
// - Type safety
```

## Phase 4: Frontend Integration

### Step 1: Update Auth Context

Create `lib/authContext.ts`:
```typescript
// Global auth state
// - Current user
// - Access token
// - Refresh token
// - Subscription info
```

### Step 2: Update Components

Each component will be updated to:
- Use API endpoints instead of localStorage
- Show loading states
- Handle errors gracefully
- Update in real-time

### Step 3: Update Routes

Main page (`app/page.tsx`) will be refactored to:
- Check auth status via API
- Fetch projects/tasks from database
- Handle pagination for large datasets
- Implement offline support (optional)

## Phase 5: Data Migration (For Existing Demo Data)

If you have demo data you want to keep:

```bash
# Export demo data from localStorage
# Create migration script that:
# 1. Reads localStorage demo data
# 2. Converts to new format
# 3. Imports into PostgreSQL
```

Script location: `scripts/migrate-demo-data.ts`

## Phase 6: Subscription System

### Features to Implement

1. **Subscription Plans**
   - FREE: 3 projects, 50 tasks
   - PRO: Unlimited projects/tasks, $9.99/month
   - ENTERPRISE: Custom pricing, advanced features

2. **Payment Processing**
   - Stripe integration
   - Subscription management
   - Invoice generation
   - Payment webhooks

3. **Feature Enforcement**
   - Check subscription on project creation
   - Check subscription on task creation
   - Enforce usage limits
   - Show upgrade prompts

### Implementation Checklist

- [ ] Create Stripe account
- [ ] Set up webhook endpoint
- [ ] Create subscription API route
- [ ] Create upgrade/downgrade API route
- [ ] Create billing dashboard
- [ ] Implement feature gating
- [ ] Add upgrade prompts in UI

## Phase 7: Admin Dashboard (Production)

The admin system will be enhanced to support:

- **User Management** (already done via localStorage, now via DB)
- **Subscription Management**
  - View user subscriptions
  - Manage billing
  - Issue refunds
  - Cancel subscriptions

- **Analytics** (upgraded)
  - Revenue tracking
  - MRR (Monthly Recurring Revenue)
  - Churn rate
  - Customer lifetime value

- **Support Tools**
  - View user data
  - Reset passwords
  - Delete accounts (GDPR)

## Implementation Roadmap

### Week 1-2: Foundation
- ✅ Database setup (DONE)
- ✅ API routes (DONE)
- ✅ Authentication (DONE)
- [ ] Frontend API client
- [ ] Update Auth components

### Week 3-4: Core Features
- [ ] Update main dashboard
- [ ] Update project management
- [ ] Update task management
- [ ] Update Eisenhower Matrix

### Week 5-6: Payment System
- [ ] Stripe integration
- [ ] Subscription API
- [ ] Billing dashboard
- [ ] Feature enforcement

### Week 7-8: Admin & Polish
- [ ] Admin dashboard upgrades
- [ ] Email notifications
- [ ] Error monitoring
- [ ] Performance optimization

### Week 9-10: Testing & Deployment
- [ ] Unit tests
- [ ] Integration tests
- [ ] Load testing
- [ ] Production deployment

## Key Implementation Tips

### 1. Dual Mode (Demo + Production)

```typescript
// In your components
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  // Use API endpoints
  const response = await fetch('/api/projects');
} else {
  // Use localStorage (for demo)
  const projects = localStorage.getItem('projects');
}
```

### 2. Token Management

```typescript
// Automatically refresh token when expiring
const token = localStorage.getItem('accessToken');
const decoded = jwt_decode(token);

if (Date.now() >= decoded.exp * 1000) {
  // Refresh token
  const newToken = await refresh();
  localStorage.setItem('accessToken', newToken);
}
```

### 3. Error Handling

```typescript
// All API calls should handle:
try {
  const response = await fetch('/api/...');
  const data = await response.json();

  if (!response.ok) {
    // Handle error
    if (response.status === 401) {
      // Token expired, refresh and retry
    }
  }
} catch (error) {
  // Network error
}
```

## Database Commands

```bash
# View database
psql -U taskmaster taskmaster_dev

# Check tables
\dt

# Check schema
\d projects

# Insert test data
INSERT INTO "User" (email, "passwordHash", name)
VALUES ('test@example.com', 'hashed_pass', 'Test User');

# Export database
pg_dump -U taskmaster taskmaster_dev > backup.sql

# Import database
psql -U taskmaster taskmaster_dev < backup.sql
```

## Troubleshooting

### Connection Issues

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U taskmaster taskmaster_dev

# Check DATABASE_URL format
echo $DATABASE_URL
# Should be: postgresql://user:password@localhost:5432/database
```

### Migration Issues

```bash
# Reset migrations (WARNING: deletes data)
npx prisma migrate reset

# Check migration status
npx prisma migrate status

# View raw SQL
npx prisma migrate diff
```

### Token Issues

```bash
# Decode JWT token
node -e "console.log(require('jsonwebtoken').decode('your-token'))"

# Check expiry
node -e "console.log(new Date(1234567890000))"
```

## Testing Your Setup

1. **Test Database Connection**
   ```bash
   npx prisma db execute --stdin < <(echo "SELECT 1")
   ```

2. **Test API**
   ```bash
   # Register
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"TestPass123!"}'

   # Login
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"TestPass123!"}'
   ```

3. **Test Protected Routes**
   ```bash
   # Get projects (requires token)
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/projects
   ```

## Next Steps

1. **Install PostgreSQL** on your machine
2. **Create the development database**
3. **Update .env.local** with database connection
4. **Run migrations** with Prisma
5. **Start implementing** frontend API client
6. **Update components** to use new APIs

Once these steps are complete, you'll have a production-ready foundation for your SaaS!

---

**Need Help?**
- Prisma Docs: https://www.prisma.io/docs
- PostgreSQL Docs: https://www.postgresql.org/docs
- Next.js API Routes: https://nextjs.org/docs/api-routes/introduction

Good luck! 🚀
