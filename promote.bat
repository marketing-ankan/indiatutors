@echo off
REM ============================================
REM  Promote tested changes:  ankan-dev  ->  main
REM  Pushing main is what deploys to Hostinger.
REM  Usage:  just double-click, or run  promote.bat
REM ============================================
cd /d "C:\xampp2\htdocs\indiatutors"

REM --- Refuse to run with uncommitted work on ankan-dev ---
git diff --quiet && git diff --cached --quiet
if errorlevel 1 (
  echo.
  echo You have uncommitted changes. Commit them first with:
  echo     push.bat "your message"
  echo Then run promote.bat again.
  pause
  exit /b 1
)

echo Switching to main...
git checkout main || goto :error

echo Merging ankan-dev into main...
git merge ankan-dev || goto :error

echo Pushing main to GitHub ^(this triggers the Hostinger deploy^)...
git push || goto :error

echo Switching back to ankan-dev...
git checkout ankan-dev || goto :error

echo.
echo ============================================
echo  Done. main is updated and deployed.
echo  You are back on ankan-dev, ready to keep working.
echo ============================================
pause
exit /b 0

:error
echo.
echo *** Something went wrong. Current branch:
git branch --show-current
echo Resolve the issue shown above, then re-run promote.bat
pause
exit /b 1
