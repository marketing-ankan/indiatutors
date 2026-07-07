@echo off
REM ============================================
REM  Quick push for IndiaTutors Online
REM  Usage:  push.bat "your commit message"
REM  (If you omit the message, a default is used)
REM ============================================
cd /d "C:\xampp2\htdocs\indiatutors"

set "MSG=%~1"
if "%MSG%"=="" set "MSG=Update IndiaTutors"

echo Staging changes...
git add -A

echo Committing...
git commit -m "%MSG%"

echo Pushing to GitHub...
git push

echo.
echo Done.
pause
