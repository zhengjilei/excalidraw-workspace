#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Kill any existing processes on these ports
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Backend
cd "$ROOT/backend"
pip install -q -r requirements.txt 2>/dev/null
uvicorn main:app --port 8000 &
BACKEND_PID=$!

# Frontend
cd "$ROOT/frontend"
npm install --silent 2>/dev/null
npx vite --port 5173 &
FRONTEND_PID=$!

echo ""
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo ""
echo "  Press Ctrl+C to stop"
echo ""

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
