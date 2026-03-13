@echo off
echo Cleaning up ports...

echo Killing all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

echo Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo Starting Backend...
start cmd /k "cd /d C:\Users\ngugi\harvest-circle\backend && npm run dev"

echo Waiting 5 seconds for backend to initialize...
timeout /t 5 /nobreak >nul

echo Starting Frontend on port 3000...
start cmd /k "cd /d C:\Users\ngugi\harvest-circle\frontend-web && set PORT=3000 && npm start"

echo.
echo ✅ Harvest Circle is starting!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
pause