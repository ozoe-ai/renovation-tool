@echo off
setlocal
cd /d "%~dp0"
echo Starting preview at http://127.0.0.1:3001/
echo Keep this window open while using the preview.
npm run dev -- -p 3001
