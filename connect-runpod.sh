#!/bin/bash
# Quick connection script for RunPod

SSH_KEY="${SSH_KEY_PATH:-$HOME/.ssh/id_ed25519_runpod_full}"
RUNPOD_IP="${RUNPOD_IP:?Error: RUNPOD_IP environment variable is not set}"
RUNPOD_PORT="${RUNPOD_PORT:?Error: RUNPOD_PORT environment variable is not set}"
RUNPOD_USER="${RUNPOD_USER:?Error: RUNPOD_USER environment variable is not set}"
RUNPOD_PROXY="${RUNPOD_PROXY:?Error: RUNPOD_PROXY environment variable is not set}"

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

