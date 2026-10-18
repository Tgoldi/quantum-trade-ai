# ✅ Deployment Successful!

## 🎉 Your Quantum Trade AI Platform is Deployed!

**Instance IP:** `<INSTANCE_IP>`  
**SSH Port:** `<SSH_PORT>`  
**SSH User:** `<SSH_USER>` (use a non-root user; disable direct root SSH login)  
**Application Port:** 3000

> Real host, port and credential details are kept in private ops documentation, not in this repository.

---

## 🌐 Access Your Application

### Option 1: Direct Access (if port is open)
- **Frontend:** http://<INSTANCE_IP>:3000

### Option 2: SSH Tunnel (Recommended)
If port 3000 is not publicly accessible, create an SSH tunnel:

```bash
ssh -p <SSH_PORT> -i ~/.ssh/id_ed25519 -L 3000:localhost:3000 <SSH_USER>@<INSTANCE_IP>
```

Then access: **http://localhost:3000**

### Option 3: Vast.ai Port Forwarding
1. Go to your Vast.ai dashboard
2. Find your instance (<INSTANCE_IP>)
3. Look for "Port Forwarding" or "Expose Port" settings
4. Forward port 3000 to make it publicly accessible

---

## 📊 Service Status

Check if the service is running:

```bash
ssh -p <SSH_PORT> -i ~/.ssh/id_ed25519 <SSH_USER>@<INSTANCE_IP> "pm2 list"
```

Expected output:
```
┌────┬─────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┐
│ id │ name                │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │
├────┼─────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┤
│ 0  │ quantum-frontend    │ default     │ N/A     │ fork    │ [PID]    │ [time] │ 0    │ online    │
└────┴─────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┘
```

---

## 🔧 Useful Commands

### View Logs
```bash
ssh -p <SSH_PORT> -i ~/.ssh/id_ed25519 <SSH_USER>@<INSTANCE_IP> "pm2 logs quantum-frontend"
```

### Restart Service
```bash
ssh -p <SSH_PORT> -i ~/.ssh/id_ed25519 <SSH_USER>@<INSTANCE_IP> "pm2 restart quantum-frontend"
```

### Stop Service
```bash
ssh -p <SSH_PORT> -i ~/.ssh/id_ed25519 <SSH_USER>@<INSTANCE_IP> "pm2 stop quantum-frontend"
```

### Check Port Status
```bash
ssh -p <SSH_PORT> -i ~/.ssh/id_ed25519 <SSH_USER>@<INSTANCE_IP> "netstat -tulpn | grep 3000"
```

### Update Application
```bash
ssh -p <SSH_PORT> -i ~/.ssh/id_ed25519 <SSH_USER>@<INSTANCE_IP> "cd <APP_DIR> && git pull && npm install && npm run build && pm2 restart quantum-frontend"
```

---

## 📁 Project Location

The application is installed at:
```
<APP_DIR>
```

---

## ✅ What's Running

- ✅ **Frontend:** React app served on port 3000
- ✅ **PM2:** Process manager (auto-restart on failure)
- ✅ **Auto-start:** Configured to start on server reboot

---

## 🔍 Troubleshooting

### Service Not Running?
```bash
ssh -p <SSH_PORT> -i ~/.ssh/id_ed25519 <SSH_USER>@<INSTANCE_IP> "pm2 restart quantum-frontend"
```

### Can't Access from Browser?
1. Check if port 3000 is forwarded in Vast.ai dashboard
2. Use SSH tunnel (Option 2 above)
3. Check firewall rules

### Need to Rebuild?
```bash
ssh -p <SSH_PORT> -i ~/.ssh/id_ed25519 <SSH_USER>@<INSTANCE_IP> "cd <APP_DIR> && npm run build && pm2 restart quantum-frontend"
```

---

## 🎯 Next Steps

1. **Access the application** using one of the methods above
2. **Register a new account** in the app
3. **Start trading!** 📈

---

**Deployment Date:** December 28, 2025  
**Status:** ✅ Successfully Deployed

