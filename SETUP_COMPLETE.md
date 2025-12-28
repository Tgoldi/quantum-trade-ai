# 🚀 Complete Setup Guide - Quantum Trade AI

## 📋 Overview

This project supports **two setup modes**:
1. **Quick Start** (Recommended) - Frontend only with Supabase backend
2. **Full Stack** - Docker with PostgreSQL, Redis, and Node.js backend

---

## ⚡ Quick Start (Recommended - 5 minutes)

### Prerequisites
- Node.js 18+ installed
- npm or yarn installed

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Create Environment File
Create `.env.local` in the project root:

```bash
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=https://ngwbwanpamfqoaitofih.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nd2J3YW5wYW1mcW9haXRvZmloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDMzNDgsImV4cCI6MjA3NzA3OTM0OH0.6kifg9e7LDp2uacxSCsDKSEdFcdpMPzFen1oMgS3iuI
EOF
```

**What this does:** Connects your frontend to the Supabase database (already configured).

### Step 3: Import Database Schema
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select project: **ngwbwanpamfqoaitofih**
3. Click **SQL Editor** (left sidebar)
4. Click **"New query"**
5. Open `supabase-schema.sql` in your editor
6. Copy entire contents and paste into SQL editor
7. Click **"Run"** (or Cmd/Ctrl + Enter)

**What this does:** Creates all required database tables (users, portfolios, trades, etc.).

### Step 4: Start the Application
```bash
npm run dev
```

### Step 5: Access the App
Open your browser: **http://localhost:5173**

**What you'll see:** The trading platform dashboard where you can:
- Register/Login
- View portfolio
- Get AI trading recommendations
- Execute paper trades
- View analytics

---

## 🐳 Full Stack Setup (Docker - 10 minutes)

### Prerequisites
- Docker Desktop installed and running
- 4GB+ RAM available for Docker

### Step 1: Create Environment File
Create `.env` in the project root:

```bash
cat > .env << 'EOF'
# Database (already configured in docker-compose)
DB_HOST=postgres
DB_PORT=5432
DB_NAME=quantumtrade
DB_USER=postgres
DB_PASSWORD=postgres

# Redis (already configured)
REDIS_HOST=redis
REDIS_PORT=6379

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Interactive Brokers (optional - for live trading)
IB_HOST=127.0.0.1
IB_PORT=7497

# Optional: API Keys for market data
FINNHUB_API_KEY=your-finnhub-key
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key
EOF
```

**What this does:** Configures environment variables for the backend services.

### Step 2: Start Docker Containers
From the project root:

```bash
docker-compose -f docker-compose-full.yml up -d
```

**What this does:** Starts 5 containers:
- **PostgreSQL** (port 5432) - Database with TimescaleDB
- **Redis** (port 6379) - Caching layer
- **Backend** (port 3001) - Node.js API server
- **Frontend** (port 5173) - React app
- **Nginx** (port 80) - Reverse proxy

### Step 3: Check Container Status
```bash
docker ps
```

**Expected:** All containers should show "Up" status. If any show "Restarting", check logs:
```bash
docker logs quantumtrade-frontend
docker logs quantumtrade-backend
```

### Step 4: Access the Application

**Option A: Direct Access**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Health: http://localhost:3001/api/health

**Option B: Via Nginx** (if configured)
- Main App: http://localhost

### Step 5: View Logs (if needed)
```bash
# All containers
docker-compose -f docker-compose-full.yml logs -f

# Specific container
docker logs quantumtrade-backend -f
docker logs quantumtrade-frontend -f
```

---

## 🔧 Troubleshooting

### Frontend/Nginx Restarting in Docker

**Problem:** Containers keep restarting

**Solution 1: Check logs**
```bash
docker logs quantumtrade-frontend --tail 100
```

**Solution 2: Rebuild containers**
```bash
docker-compose -f docker-compose-full.yml down
docker-compose -f docker-compose-full.yml up -d --build
```

**Solution 3: Use Quick Start instead**
The Docker setup may have configuration issues. Use the Quick Start method (Supabase) which is simpler and more reliable.

### Port Already in Use

**Problem:** Port 5173, 3001, or 5432 already in use

**Solution:**
```bash
# Find and kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Find and kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Find and kill process on port 5432
lsof -ti:5432 | xargs kill -9
```

### Database Connection Issues

**Problem:** Can't connect to database

**Solution:**
1. Verify Supabase schema is imported (Quick Start)
2. Check Docker containers are running: `docker ps`
3. Verify environment variables are correct
4. Check database logs: `docker logs quantumtrade-postgres`

### Module Not Found Errors

**Problem:** npm packages missing

**Solution:**
```bash
# Remove and reinstall
rm -rf node_modules package-lock.json
npm install

# For backend
cd server
rm -rf node_modules package-lock.json
npm install
cd ..
```

---

## 📊 What Each Setup Provides

### Quick Start (Supabase)
✅ **Pros:**
- Fastest setup (5 minutes)
- No Docker required
- Database already configured
- Easy to get started

❌ **Cons:**
- Limited to Supabase features
- No local backend services
- Requires internet connection

### Full Stack (Docker)
✅ **Pros:**
- Complete local development environment
- All services in containers
- Production-like setup
- Full control over backend

❌ **Cons:**
- More complex setup
- Requires Docker
- More resources needed
- May need troubleshooting

---

## 🎯 Recommended Approach

**For first-time users:** Use **Quick Start** (Supabase)
- Faster
- Less configuration
- More reliable
- Same features

**For development:** Use **Full Stack** (Docker)
- Full control
- Local services
- Production-like environment

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Frontend loads at http://localhost:5173
- [ ] Can register a new account
- [ ] Can login successfully
- [ ] Dashboard displays correctly
- [ ] Backend API responds (if using Docker)
- [ ] Database connection works

---

## 🚀 Next Steps

Once setup is complete:

1. **Register an account** in the app
2. **Explore the dashboard** - View portfolio, AI recommendations
3. **Try paper trading** - Execute virtual trades
4. **Check analytics** - View performance metrics
5. **Read documentation** - See `QUICK_START.md` for feature details

---

## 📚 Additional Resources

- `QUICK_START.md` - Detailed feature guide
- `SETUP_GUIDE.md` - Extended setup instructions
- `server/README.md` - Backend API documentation
- `START_HERE.md` - Project overview

---

## 🆘 Need Help?

1. Check container logs: `docker logs <container-name>`
2. Verify environment variables are set correctly
3. Ensure all prerequisites are installed
4. Review error messages in browser console (F12)
5. Check the troubleshooting section above

---

**Happy Trading! 📈**

