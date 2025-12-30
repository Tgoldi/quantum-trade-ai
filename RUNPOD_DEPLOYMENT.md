# 🚀 RunPod Deployment Guide

## 📋 Your RunPod Instance Details

- **Pod Name:** tradingAI
- **Pod ID:** cu82csig6miezh
- **SSH IP:** 69.30.85.169
- **SSH Port:** 22183
- **HTTP Services:** Ports 7777, 11434

---

## 🔧 Step 1: Set Up SSH Key

### Generate SSH Key (if you haven't already)

```bash
ssh-keygen -t ed25519 -C "tomerg.work@gmail.com"
```

### Copy Your Public Key

```bash
cat ~/.ssh/id_ed25519.pub
```

### Add to RunPod

1. Go to your RunPod dashboard
2. Navigate to your Pod: **tradingAI**
3. Go to the **"Connect"** tab
4. Paste your public key in the "SSH public key" field
5. Click **"Save"**

---

## 🔐 Step 2: Connect to RunPod Instance

```bash
ssh -p 22183 root@69.30.85.169
```

Or if you have a specific SSH key:

```bash
ssh -p 22183 -i ~/.ssh/id_ed25519 root@69.30.85.169
```

---

## 📦 Step 3: Deploy the Application

Once connected, run the deployment script:

```bash
curl -fsSL https://raw.githubusercontent.com/Tgoldi/quantum-trade-ai/main/quick-deploy-runpod.sh | bash
```

**OR** clone and run manually:

```bash
cd /workspace
git clone https://github.com/Tgoldi/quantum-trade-ai.git
cd quantum-trade-ai
chmod +x quick-deploy-runpod.sh
./quick-deploy-runpod.sh
```

---

## 🌐 Step 4: Access Your Application

### Option A: Use RunPod HTTP Service (Port 7777)

The application will be configured to run on port 7777, which is already exposed via RunPod's HTTP service.

**Access:** Use the HTTP service link from your RunPod dashboard (Port 7777 -> HTTP Service)

### Option B: Direct Access

If you configure the app to use a different port, you can access it via:
- **HTTP Service:** Use the RunPod HTTP service links
- **SSH Tunnel:** `ssh -p 22183 -L 3000:localhost:3000 root@69.30.85.169`

---

## 🔧 Quick Deploy Commands

### Full Deployment (One Command)

```bash
ssh -p 22183 root@69.30.85.169 "cd /workspace && git clone https://github.com/Tgoldi/quantum-trade-ai.git && cd quantum-trade-ai && chmod +x quick-deploy-runpod.sh && ./quick-deploy-runpod.sh"
```

### Manual Steps

```bash
# 1. Connect
ssh -p 22183 root@69.30.85.169

# 2. Install dependencies
apt-get update
apt-get install -y curl wget git build-essential

# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 4. Install PM2
npm install -g pm2 serve

# 5. Clone repository
cd /workspace
git clone https://github.com/Tgoldi/quantum-trade-ai.git
cd quantum-trade-ai

# 6. Install dependencies
npm install
cd server && npm install && cd ..

# 7. Create environment
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=https://ngwbwanpamfqoaitofih.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nd2J3YW5wYW1mcW9haXRvZmloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDMzNDgsImV4cCI6MjA3NzA3OTM0OH0.6kifg9e7LDp2uacxSCsDKSEdFcdpMPzFen1oMgS3iuI
EOF

# 8. Build frontend
npm run build

# 9. Start on port 7777 (RunPod HTTP service)
pm2 start "npx serve dist -l 7777" --name quantum-frontend
pm2 save
pm2 startup
```

---

## 📊 Service Management

### Check Status

```bash
ssh -p 22183 root@69.30.85.169 "pm2 list"
```

### View Logs

```bash
ssh -p 22183 root@69.30.85.169 "pm2 logs quantum-frontend"
```

### Restart Service

```bash
ssh -p 22183 root@69.30.85.169 "pm2 restart quantum-frontend"
```

### Stop Service

```bash
ssh -p 22183 root@69.30.85.169 "pm2 stop quantum-frontend"
```

---

## 🔄 Update Application

```bash
ssh -p 22183 root@69.30.85.169 "cd /workspace/quantum-trade-ai && git pull && npm install && npm run build && pm2 restart quantum-frontend"
```

---

## 🌐 Port Configuration

RunPod provides HTTP services on specific ports. The deployment script will configure the app to use:

- **Port 7777** - Main application (via RunPod HTTP service)
- **Port 3000** - Alternative (if needed)

You can access the app via the HTTP service link in your RunPod dashboard.

---

## ✅ Verification

After deployment, verify:

1. **Service is running:**
   ```bash
   ssh -p 22183 root@69.30.85.169 "pm2 list"
   ```

2. **Port is listening:**
   ```bash
   ssh -p 22183 root@69.30.85.169 "netstat -tulpn | grep 7777"
   ```

3. **Application responds:**
   ```bash
   ssh -p 22183 root@69.30.85.169 "curl http://localhost:7777"
   ```

---

## 🐛 Troubleshooting

### SSH Connection Failed

1. Make sure your SSH key is added to RunPod dashboard
2. Verify the IP and port: `69.30.85.169:22183`
3. Check if the Pod is running (green status)

### Service Not Starting

```bash
# Check logs
ssh -p 22183 root@69.30.85.169 "pm2 logs quantum-frontend --lines 50"

# Rebuild
ssh -p 22183 root@69.30.85.169 "cd /workspace/quantum-trade-ai && npm run build && pm2 restart quantum-frontend"
```

### Port Not Accessible

- Use RunPod's HTTP service (port 7777) - it's already configured
- Check RunPod dashboard for HTTP service links
- Verify the service is running: `pm2 list`

---

## 📝 Notes

- RunPod instances typically use `/workspace` as the working directory
- HTTP services are automatically exposed via RunPod's proxy
- PM2 will keep the service running even if you disconnect
- The app will auto-restart on server reboot (if PM2 startup is configured)

---

**Ready to deploy!** 🚀

