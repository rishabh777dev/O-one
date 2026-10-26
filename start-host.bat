@echo off
title O1 Host Daemon - Live Agent Gateway
echo ========================================================
echo          STARTING O ONE HOST DAEMON ON LAPTOP
echo ========================================================
cd /d "%~dp0host-daemon"
call npx tsx server.ts
pause
