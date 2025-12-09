@echo off
title Project Dashboard Server
echo ==========================================
echo      Starting Project Dashboard...
echo ==========================================
echo.
echo Opening browser at http://localhost:8000...
start "" "http://localhost:8000"
echo.
echo Server is running. Close this window to stop the server.
echo.
node server.js
pause
