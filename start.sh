#!/bin/bash
set -e

echo "=========================================================="
echo "      ANIME SCENE FINDER — LOCAL AMV ENGINE LAUNCHER      "
echo "=========================================================="

# Check python virtual environment
if [ ! -d "venv" ]; then
    echo "[1/3] Creating Python virtual environment..."
    python3 -m venv venv
    ./venv/bin/pip install --upgrade pip
    ./venv/bin/pip install fastapi uvicorn pydantic scenedetect opencv-python-headless pillow pysrt webvtt-py pytest httpx
fi

# Check frontend node_modules
if [ ! -d "frontend/node_modules" ]; then
    echo "[2/3] Installing frontend dependencies..."
    (cd frontend && npm install)
fi

echo "[3/3] Launching FastAPI backend and Vite frontend..."

# Start FastAPI backend in background
./venv/bin/python3 -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# Start Vite frontend
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "🚀 Anime Scene Finder is running!"
echo "   Frontend Web UI: http://localhost:3000"
echo "   Backend REST API: http://127.0.0.1:8000/docs"
echo ""

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
