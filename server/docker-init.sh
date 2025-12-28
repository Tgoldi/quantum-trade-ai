#!/bin/bash

# Docker initialization script for Multi-Model AI Trading System
# Ensures all 4 specialized LLMs are loaded and ready

echo "🐳 Initializing Multi-Model AI Trading System..."

# Start Ollama server in background
echo "🚀 Starting Ollama server..."
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama server to start..."
sleep 15

# Function to check if Ollama is ready
check_ollama_ready() {
    curl -s http://localhost:11434/api/tags > /dev/null 2>&1
    return $?
}

# Wait for Ollama to be fully ready
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if check_ollama_ready; then
        echo "✅ Ollama server is ready!"
        break
    fi
    echo "⏳ Attempt $((attempt + 1))/$max_attempts - waiting for Ollama..."
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ Failed to start Ollama server"
    exit 1
fi

# Download and load all 4 specialized models
echo "📥 Downloading specialized AI models..."

models=("llama3.1:8b" "mistral:7b" "phi3:mini" "codellama:13b")
model_purposes=("Technical Analysis" "Risk Assessment" "Sentiment Analysis" "Strategy & Algorithms")

for i in "${!models[@]}"; do
    model="${models[$i]}"
    purpose="${model_purposes[$i]}"
    
    echo "📥 Downloading $model for $purpose..."
    
    if ollama pull "$model"; then
        echo "✅ Successfully downloaded $model"
        
        # Test the model with a simple query
        echo "🧪 Testing $model..."
        if echo "Test" | ollama run "$model" --timeout 10s > /dev/null 2>&1; then
            echo "✅ $model is working correctly"
        else
            echo "⚠️ $model downloaded but may need warming up"
        fi
    else
        echo "❌ Failed to download $model"
        exit 1
    fi
done

echo "🎉 All models downloaded successfully!"

# Optimize Ollama settings for multiple models
echo "⚙️ Optimizing Ollama for multiple models..."

# Set environment variables for better performance
export OLLAMA_NUM_PARALLEL=8
export OLLAMA_MAX_LOADED_MODELS=4
export OLLAMA_FLASH_ATTENTION=1

echo "✅ Optimization settings applied"

# Keep Ollama running
echo "🔄 Keeping Ollama server running..."
wait $OLLAMA_PID
