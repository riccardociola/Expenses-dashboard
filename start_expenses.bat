@echo off
set "ROOT=%~dp0"

echo Starting Expenses Dashboard...

REM Start FastAPI using the repository virtual environment.
start "Expenses Backend" /min /D "%ROOT%backend" cmd /k ""%ROOT%.venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1"

REM Keep Next.js accessible only on this computer.
start "Expenses Frontend" /min /D "%ROOT%frontend" cmd /k "npm run dev -- --hostname 127.0.0.1"

timeout /t 5 /nobreak > nul
start "" "http://localhost:3000"
