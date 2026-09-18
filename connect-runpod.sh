#!/bin/bash
# Quick connection script for RunPod

# Required environment variables (must be set before running this script):
#   RUNPOD_SSH_KEY   - path to your RunPod SSH private key
#   RUNPOD_IP        - RunPod instance IP address
#   RUNPOD_PORT      - RunPod SSH port
#   RUNPOD_USER      - SSH user (e.g. root)
#   RUNPOD_PROXY     - RunPod proxy SSH target (user@ssh.runpod.io)
SSH_KEY="${RUNPOD_SSH_KEY:-$HOME/.ssh/id_ed25519_runpod}"
RUNPOD_IP="${RUNPOD_IP:?Error: RUNPOD_IP must be set}"
RUNPOD_PORT="${RUNPOD_PORT:?Error: RUNPOD_PORT must be set}"
RUNPOD_USER="${RUNPOD_USER:?Error: RUNPOD_USER must be set}"
RUNPOD_PROXY="${RUNPOD_PROXY:?Error: RUNPOD_PROXY must be set}"

echo "🔌 Connecting to RunPod..."
echo ""

# Try direct TCP connection first
if ssh -p $RUNPOD_PORT -i $SSH_KEY -o ConnectTimeout=5 $RUNPOD_USER@$RUNPOD_IP "echo 'Connected!'" 2>/dev/null; then
    echo "✅ Using direct TCP connection"
    ssh -p $RUNPOD_PORT -i $SSH_KEY $RUNPOD_USER@$RUNPOD_IP
else
    echo "⚠️  Direct connection failed, trying RunPod proxy..."
    ssh -i $SSH_KEY $RUNPOD_PROXY
fi

