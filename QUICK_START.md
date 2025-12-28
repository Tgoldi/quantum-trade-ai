# 🚀 **QUICK START GUIDE**

## **Prerequisites**
- Node.js 18+ installed
- npm or yarn installed
- Supabase project created (✅ Already done!)

---

## **Step 1: Install Dependencies** (2 minutes)

```bash
# Install frontend dependencies
npm install

# (Optional) Install backend dependencies if you want to run the backend
cd server && npm install && cd ..
```

---

## **Step 2: Set Up Environment Variables** (1 minute)

Create a `.env.local` file in the project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://ngwbwanpamfqoaitofih.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nd2J3YW5wYW1mcW9haXRvZmloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDMzNDgsImV4cCI6MjA3NzA3OTM0OH0.6kifg9e7LDp2uacxSCsDKSEdFcdpMPzFen1oMgS3iuI
```

**Quick command:**
```bash
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=https://ngwbwanpamfqoaitofih.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nd2J3YW5wYW1mcW9haXRvZmloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDMzNDgsImV4cCI6MjA3NzA3OTM0OH0.6kifg9e7LDp2uacxSCsDKSEdFcdpMPzFen1oMgS3iuI
EOF
```

---

## **Step 3: Import Database Schema** (5 minutes)

**Before starting the app, you need to import the database schema:**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click on your project: **ngwbwanpamfqoaitofih**
3. Go to **SQL Editor** (left sidebar)
4. Click **"New query"**
5. Open `supabase-schema.sql` in your editor
6. Copy the entire contents
7. Paste into the SQL editor
8. Click **"Run"** (or press Cmd/Ctrl + Enter)

**Verify tables are created:**
- Go to **Table Editor** (left sidebar)
- You should see 12 tables created

---

## **Step 4: Start the Application** (30 seconds)

### **Option A: Frontend Only (Recommended - Using Supabase)**

```bash
npm run dev
```

Then open: **http://localhost:5173**

### **Option B: Full Stack (Frontend + Backend)**

```bash
npm run start:dev
```

This will start:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

---

## **Step 5: Test the Application**

1. **Open** http://localhost:5173
2. **Register** a new account (or use demo credentials)
3. **Login** and explore the dashboard
4. **Test features**:
   - Portfolio management
   - AI trading decisions
   - Market data
   - Charts

---

## **📋 Available Commands**

### **Frontend Commands**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run linter
```

### **Backend Commands** (if using backend)
```bash
cd server
npm start            # Start backend server
npm run dev          # Start with nodemon (auto-reload)
npm test             # Run tests
```

### **Docker Commands** (if using Docker)
```bash
npm run docker:build # Build Docker images
npm run docker:up    # Start Docker containers
npm run docker:down  # Stop Docker containers
npm run docker:logs  # View Docker logs
```

---

## **🔧 Troubleshooting**

### **Port Already in Use**
```bash
# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9

# Kill process on port 3001 (backend)
lsof -ti:3001 | xargs kill -9
```

### **Environment Variables Not Loading**
- Make sure `.env.local` is in the project root
- Restart the dev server after creating `.env.local`
- Check variable names start with `VITE_` (for Vite)

### **Database Connection Issues**
- Verify Supabase schema is imported
- Check Supabase dashboard for connection status
- Verify environment variables are correct

### **Module Not Found Errors**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## **🎯 Quick Start (Copy & Paste)**

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=https://ngwbwanpamfqoaitofih.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nd2J3YW5wYW1mcW9haXRvZmloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDMzNDgsImV4cCI6MjA3NzA3OTM0OH0.6kifg9e7LDp2uacxSCsDKSEdFcdpMPzFen1oMgS3iuI
EOF

# 3. Start the app
npm run dev
```

**Then import the database schema in Supabase dashboard!**

---

## **✅ You're Ready!**

Once you've:
1. ✅ Installed dependencies
2. ✅ Created `.env.local`
3. ✅ Imported database schema
4. ✅ Started the dev server

**Open http://localhost:5173 and start trading!** 🚀