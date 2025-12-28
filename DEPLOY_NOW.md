# 🚀 Deploy to Vast.ai - Quick Start

## Your Vast.ai Instance Details
- **IP Address:** 50.217.254.167
- **SSH Port:** 41221
- **User:** root

---

## ⚡ Quick Deploy (Copy & Paste)

### Step 1: Connect to Your Server

```bash
ssh -p 41221 root@50.217.254.167
```

### Step 2: Run the Deployment Script

Once connected, run this command:

```bash
curl -fsSL https://raw.githubusercontent.com/Tgoldi/quantum-trade-ai/main/quick-deploy-vast.sh | bash
```

**OR** if you prefer to clone and run manually:

```bash
cd /opt && git clone https://github.com/Tgoldi/quantum-trade-ai.git && cd quantum-trade-ai && chmod +x quick-deploy-vast.sh && ./quick-deploy-vast.sh
```

---

## ⏱️ What Happens Next

The script will automatically:
1. ✅ Install Node.js 18, Docker, PM2
2. ✅ Clone the repository
3. ✅ Install all dependencies
4. ✅ Set up environment variables
5. ✅ Build the frontend
6. ✅ Start the application on port 3000
7. ✅ Configure firewall

**Time:** ~5-10 minutes

---

## 🌐 Access Your Application

After deployment completes, access at:

- **Frontend:** http://50.217.254.167:3000
- **Backend API:** http://50.217.254.167:3001/api/health

---

## 📊 Useful Commands (On Server)

```bash
# Check if app is running
pm2 list

# View logs
pm2 logs quantum-frontend

# Restart app
pm2 restart quantum-frontend

# Stop app
pm2 stop quantum-frontend

# Check what's running on ports
netstat -tulpn | grep -E '3000|3001'
```

---

## 🔄 Update Application

To update to the latest version:

```bash
cd /opt/quantum-trade-ai
git pull
npm install
npm run build
pm2 restart quantum-frontend
```

---

## ✅ That's It!

Your Quantum Trade AI platform is now live at:
**http://50.217.254.167:3000**

---

**Need Help?** Check `VAST_AI_DEPLOYMENT.md` for detailed troubleshooting.

