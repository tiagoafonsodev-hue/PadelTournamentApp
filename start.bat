@echo off
echo Starting Padel Tournament App...
echo.
echo Killing any existing Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo Starting Backend on port 3001...
start "Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul

echo Starting Frontend on port 3000...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers starting...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
