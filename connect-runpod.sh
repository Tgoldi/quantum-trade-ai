#!/bin/bash
# Quick connection script for RunPod

SSH_KEY="$HOME/.ssh/id_ed25519_runpod_full"
RUNPOD_IP="69.30.85.169"
RUNPOD_PORT="22183"
RUNPOD_USER="root"
RUNPOD_PROXY="cu82csig6miezh-64411956@ssh.runpod.io"

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

