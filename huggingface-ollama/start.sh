#!/bin/bash
set -e

echo "🚀 Starting Ollama on port 7860..."
ollama serve &

echo "⏳ Waiting for Ollama to initialize..."
sleep 8

echo "📦 Pulling tinyllama model (637MB)..."
ollama pull tinyllama

echo "✅ Model ready! Ollama is serving on port 7860."
wait
