@echo off
cd /d "C:\Users\ricca\Desktop\Expenses-dashboard"

echo Starting Expenses Dashboard...

start "Expenses Backend" /min cmd /k "cd /d C:\Users\ricca\Desktop\Expenses-dashboard\backend && ..\.venv\Scripts\python.exe -m uvicorn app.main:app"

start "Expenses Frontend" /min cmd /k "cd /d C:\Users\ricca\Desktop\Expenses-dashboard\frontend && npm run dev"

timeout /t 4 /nobreak > nul

start "" "http://localhost:3000"
