@echo off
echo Starting Logistics System...
echo.

echo Starting Backend Server...
start "Backend" cmd /k "cd backend && npm install && npm run dev"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause >nul
