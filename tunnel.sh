#!/bin/bash
# SSH Tunnel Helper for Vast.ai Quantum Trade AI

SSH_KEY="$HOME/.ssh/id_ed25519"
SSH_PORT=41221
REMOTE_HOST="50.217.254.167"
LOCAL_PORT=3000
REMOTE_PORT=3000

case "$1" in
  start)
    echo "🚀 Starting SSH tunnel..."
    ssh -p $SSH_PORT -i $SSH_KEY -L $LOCAL_PORT:localhost:$REMOTE_PORT -N root@$REMOTE_HOST &
    TUNNEL_PID=$!
    echo $TUNNEL_PID > /tmp/vast-tunnel.pid
    sleep 2
    if ps -p $TUNNEL_PID > /dev/null; then
      echo "✅ Tunnel started! Access at: http://localhost:$LOCAL_PORT"
      echo "   PID: $TUNNEL_PID"
    else
      echo "❌ Failed to start tunnel"
      exit 1
    fi
    ;;
  stop)
    if [ -f /tmp/vast-tunnel.pid ]; then
      TUNNEL_PID=$(cat /tmp/vast-tunnel.pid)
      kill $TUNNEL_PID 2>/dev/null
      rm /tmp/vast-tunnel.pid
      echo "🛑 Tunnel stopped"
    else
      pkill -f "ssh.*$SSH_PORT.*$LOCAL_PORT"
      echo "🛑 Tunnel stopped (killed all matching processes)"
    fi
    ;;
  status)
    if [ -f /tmp/vast-tunnel.pid ]; then
      TUNNEL_PID=$(cat /tmp/vast-tunnel.pid)
      if ps -p $TUNNEL_PID > /dev/null; then
        echo "✅ Tunnel is running (PID: $TUNNEL_PID)"
        echo "   Access at: http://localhost:$LOCAL_PORT"
      else
        echo "❌ Tunnel is not running"
      fi
    else
      if pgrep -f "ssh.*$SSH_PORT.*$LOCAL_PORT" > /dev/null; then
        echo "✅ Tunnel is running"
        echo "   Access at: http://localhost:$LOCAL_PORT"
      else
        echo "❌ Tunnel is not running"
      fi
    fi
    ;;
  *)
    echo "Usage: $0 {start|stop|status}"
    echo ""
    echo "Commands:"
    echo "  start   - Start SSH tunnel to Vast.ai instance"
    echo "  stop    - Stop SSH tunnel"
    echo "  status  - Check tunnel status"
    exit 1
    ;;
esac

