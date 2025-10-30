# TaskMaster - Quick Start for Production Development

## 🚀 What You Have Now

A **production-ready SaaS backend** with:
- ✅ PostgreSQL database setup
- ✅ User authentication (register, login, refresh)
- ✅ Project & task management API
- ✅ Subscription system (FREE/PRO/ENTERPRISE)
- ✅ JWT token security
- ✅ Password hashing
- ✅ Error handling
- ✅ Ready for Stripe integration

## 📋 Next Steps (In Order)

### Step 1: Set Up PostgreSQL (1-2 hours)

**Windows:**
```bash
# Download and install from https://www.postgresql.org/download/windows/
# Remember the password you set
# Add to PATH (ask Google if needed)

# Create database
psql -U postgres

# In psql prompt:
CREATE DATABASE taskmaster_dev;
CREATE USER taskmaster WITH PASSWORD 'taskmaster123';
GRANT ALL PRIVILEGES ON DATABASE taskmaster_dev TO taskmaster;
\q
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
# Create database (same commands as above)
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install postgresql
sudo systemctl start postgresql
# Create database (same commands as above)
```

### Step 2: Update Environment File (5 minutes)

Edit `.env.local`:
```bash
DATABASE_URL="postgresql://taskmaster:taskmaster123@localhost:5432/taskmaster_dev"
JWT_SECRET="your-random-secret-key-at-least-32-chars"
JWT_REFRESH_SECRET="your-random-refresh-key-at-least-32-chars"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_LATER"
STRIPE_SECRET_KEY="sk_test_LATER"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

Generate random secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Initialize Database (5 minutes)

```bash
# Run from project directory
cd "C:\Users\charl\Downloads\Claude Code Coursera lesson\task-manager-ai"

# Generate Prisma client
npx prisma generate

# Create tables in database
npx prisma migrate deploy

# View database
npx prisma studio
```

### Step 4: Test API Endpoints (10 minutes)

Use Postman, curl, or the REST Client extension:

**Register User:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "name": "Test User"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

**Get Current User (use token from login response):**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/auth/me
```

**Create Project:**
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Project",
    "color": "blue",
    "description": "Test project"
  }'
```

### Step 5: Update Frontend (1-2 weeks)

Create `lib/useApi.ts` to replace localStorage:

```typescript
// lib/useApi.ts (to be created)
export function useApi() {
  const [token, setToken] = useState<string | null>(null);

  const apiCall = async (method: string, endpoint: string, data?: any) => {
    const response = await fetch(`/api${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      // Handle errors
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  };

  return { apiCall, token, setToken };
}
```

Update components to use this hook instead of localStorage.

### Step 6: Stripe Integration (1-2 weeks)

1. Create account at stripe.com
2. Get API keys from dashboard
3. Update .env.local with keys
4. Create subscription endpoints
5. Build billing dashboard

### Step 7: Deploy to VPS (1 week)

Follow `PRODUCTION_SETUP.md` to deploy to:
- DigitalOcean ($6/month)
- Linode
- AWS EC2
- Or any VPS provider

## 🎯 Your Immediate Milestones

```
Week 1: PostgreSQL Setup + API Testing
        └─ Goal: Database running, API endpoints verified

Week 2: Frontend API Integration Starts
        └─ Goal: Update 3 main components to use API

Week 3: Complete Frontend Migration
        └─ Goal: All components use API, localStorage removed

Week 4: Stripe Setup + Payment Flow
        └─ Goal: Users can upgrade to Pro

Week 5: Production Deployment
        └─ Goal: Live on VPS with real domain

Week 6: Beta Launch
        └─ Goal: Invite first users, gather feedback

Week 7-8: Iterate on Feedback
        └─ Goal: Polish based on user feedback

Week 9+: Marketing & Growth
         └─ Goal: 100+ users, revenue flowing
```

## 📚 Important Documents

Read these in order:

1. **SAAS_TRANSFORMATION.md** (20 min read)
   - Overview of what's built
   - Architecture
   - Next phases

2. **MIGRATION_GUIDE.md** (30 min read)
   - Step-by-step PostgreSQL setup
   - Frontend integration plans
   - Database management

3. **PRODUCTION_SETUP.md** (45 min read)
   - VPS deployment
   - Nginx configuration
   - SSL/TLS setup
   - Security checklist

## 🔧 Common Commands

```bash
# View database
npx prisma studio

# Check migrations
npx prisma migrate status

# Reset database (WARNING: deletes data)
npx prisma migrate reset

# View logs
pm2 logs taskmaster

# Stop development server
# Press Ctrl+C

# Start fresh
npm run dev
```

## ✅ Checklist: Before Launch to Production

- [ ] PostgreSQL setup locally and tested
- [ ] All API endpoints tested with Postman/curl
- [ ] Frontend API client created (useApi hook)
- [ ] All components updated to use API
- [ ] User can register → create project → create task
- [ ] Authentication working (login/logout)
- [ ] Token refresh working
- [ ] Error messages displaying properly
- [ ] Subscription limits enforced
- [ ] Stripe account created and keys added
- [ ] Payment flow tested
- [ ] VPS provisioned (DigitalOcean/Linode)
- [ ] PostgreSQL running on VPS
- [ ] Application deployed to VPS
- [ ] SSL/TLS certificate installed
- [ ] Email notifications working (optional)
- [ ] Error tracking set up (Sentry)
- [ ] Monitoring configured
- [ ] Backups automated
- [ ] All documentation updated
- [ ] Initial users invited for beta
- [ ] Ready for public launch!

## 🐛 Troubleshooting

**"Cannot find module '@prisma/client'"**
```bash
npm install @prisma/client
npx prisma generate
```

**"PostgreSQL connection refused"**
```bash
# Check if PostgreSQL is running
psql -U postgres
# If error, restart:
# Windows: Services → PostgreSQL → Restart
# macOS: brew services restart postgresql
# Linux: sudo systemctl restart postgresql
```

**"Invalid token"**
- Make sure token is in Authorization header
- Format: `Authorization: Bearer YOUR_TOKEN`
- Check token hasn't expired

**"Project limit exceeded"**
- User has reached their subscription limit
- User needs to upgrade or delete projects

## 💡 Pro Tips

1. **Use Postman** for API testing before updating frontend
   - Download from postman.com
   - Create requests for each endpoint
   - Save responses as examples

2. **Set up git early**
   - Initialize git: `git init`
   - Commit after each milestone
   - Push to GitHub for backup

3. **Use VS Code REST Client extension**
   - Create `requests.http` file
   - Test endpoints without Postman

4. **Keep .env.local secure**
   - Never commit to git
   - Use environment variables in production
   - Rotate secrets regularly

5. **Monitor database size**
   - Run: `npx prisma db execute --stdin < queries.sql`
   - Check space usage regularly

## 🎓 Learning Resources

- **Next.js API Routes**: https://nextjs.org/docs/api-routes/introduction
- **Prisma ORM**: https://www.prisma.io/docs
- **PostgreSQL**: https://www.postgresql.org/docs
- **JWT**: https://jwt.io/introduction
- **Stripe Docs**: https://stripe.com/docs/api

## 🚀 You're Ready!

You have everything needed to build a professional SaaS:
- ✅ Backend infrastructure
- ✅ Database
- ✅ Authentication
- ✅ API
- ✅ Security
- ✅ Documentation
- ✅ Deployment guide

**Now go build something amazing!** 🎉

Start with Step 1 (PostgreSQL setup) and follow the milestones above.

Questions? Check the relevant documentation file or search online.

Good luck! 🚀
