@echo off
title Kaju AI Voice Assistant - MERN Full Stack
color 0B

echo ===================================================================
echo               🎙️  STARTING KAJU AI VOICE ASSISTANT  🎙️
echo ===================================================================
echo  1. Starting Express & MongoDB API Server on port 5000...
echo  2. Starting React Vite Frontend on port 5173...
echo ===================================================================

start "Kaju Backend (Express API)" cmd /k "cd backend && npm run dev"
timeout /t 2 /nobreak >nul
start "Kaju Frontend (React UI)" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Both servers launched!
echo 👉 Open your browser at: http://localhost:5173
echo.
pause
