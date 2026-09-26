@echo off
title YouTube Session Refresher - OdishaExamPrep
cd /d "%~dp0"
cls
echo =================================================================
echo  ODISHA EXAM PREP - AUTOMATED YOUTUBE SESSION REFRESH TOOL
echo =================================================================
echo  1. Chrome will open on your screen navigating to YouTube Studio.
echo  2. Sign in to your Google Account (OdishaExamPrep).
echo  3. As soon as YouTube Studio loads, this tool will automatically:
echo     - Save fresh cookies to yt_state.json
echo     - Upload new secrets to GitHub Actions (Pixduct/odisha-mcq-engine)
echo     - Copy the secret to your clipboard
echo =================================================================
echo.
python automations\extract_yt_cookies.py
pause
