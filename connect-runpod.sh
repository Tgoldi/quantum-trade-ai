#!/bin/bash
# Quick connection script for RunPod

SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519_runpod_full}"
RUNPOD_IP="${RUNPOD_IP:-localhost}"
RUNPOD_PORT="${RUNPOD_PORT:-22}"
RUNPOD_USER="${RUNPOD_USER:-root}"
RUNPOD_PROXY="${RUNPOD_PROXY:?Error: RUNPOD_PROXY environment variable must be set}"

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

