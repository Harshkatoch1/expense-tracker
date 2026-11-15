@echo off
title Kharcha Expense Tracker - Live Online
cd /d "%~dp0"
set PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%

echo [1/2] Starting local server & database...
start /b "" node server.js

echo [2/2] Connecting to public internet via Cloudflare...
start "" "%TEMP%\cloudflared.exe" tunnel --url http://localhost:3000

echo.
echo =========================================================
echo   Kharcha Daily Expense Tracker is LIVE ONLINE!
echo   Website Link: https://beverage-favour-buf-jimmy.trycloudflare.com
echo =========================================================
echo.
echo You can open this link on your phone, laptop, or share it!
echo Keep this window open while you want the website online.
echo.
pause

