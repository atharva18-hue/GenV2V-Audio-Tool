@echo off
REM Manual Override Pipeline - No Smoothing, Just Anime
setlocal enabledelayedexpansion

if "%~1"=="" (
    echo.
    echo --------------------------------------------------------
    echo   DRAG AND DROP YOUR VIDEO FILE ONTO THIS BATCH FILE
    echo --------------------------------------------------------
    echo.
    pause
    exit /b 1
)

set INPUT=%~1
set BASE=manual_out_%~n1

echo [1/4] Setting up folders...
if exist "%BASE%" rmdir /s /q "%BASE%"
mkdir "%BASE%"
mkdir "%BASE%\frames"
mkdir "%BASE%\styled"

echo [2/4] Extracting frames...
python scripts\extract_frames.py --video "%INPUT%" --out "%BASE%\frames"

echo [3/4] Applying "Titan" Anime Style...
REM Note: We are skipping resize to keep max quality
python scripts\apply_animegan.py --frames "%BASE%\frames" --out "%BASE%\styled" --pretrained paprika

echo [4/4] Creating Video (No Smoothing)...
python scripts\reassemble.py --frames "%BASE%\styled" --out "%BASE%\final_anime.mp4" --fps 30 --audio "%INPUT%"

echo.
echo ========================================================
echo   DONE!
echo   Your video is here: %BASE%\final_anime.mp4
echo ========================================================
pause