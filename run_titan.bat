@echo off
cd /d %~dp0
echo [INFO] Activating V2V Environment...
call .venv\Scripts\activate

echo [INFO] Starting Titan Converter...
python titan_direct.py
pause