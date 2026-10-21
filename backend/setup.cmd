@echo off
REM FocusForge backend setup (Windows). Run from the backend folder:  setup.cmd
REM Before running: PostgreSQL must be installed (password 0000) and a database named "focusforge" must exist.

cd /d "%~dp0"

echo.
echo === 1/4  Installing packages ===
call npm install
if errorlevel 1 goto fail

echo.
echo === 2/4  Creating database tables ===
call npx prisma db push
if errorlevel 1 goto fail

echo.
echo === 3/4  Adding demo data ===
call npm run seed
if errorlevel 1 goto fail

echo.
echo === 4/4  Starting the server ===
echo Open http://localhost:4000/health to check it. Keep this window open.
call npm run dev
goto end

:fail
echo.
echo *** Something failed. Take a screenshot of the red text above and send it to Claude. ***

:end
pause
