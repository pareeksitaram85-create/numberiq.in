@echo off
setlocal
title Check the Tally connection
set ENGINE=%~dp0..\_engine

echo ================================================================
echo   TALLY CONNECTION CHECK
echo ================================================================
echo.
echo   Run this first if an export fails to connect. It tests
echo   port 9000 and reports what Tally is (or is not) answering.
echo   Nothing is exported and nothing is changed.
echo ================================================================
echo.

python "%ENGINE%\check_tally_config.py"
echo.
python "%ENGINE%\diagnose_tally.py"

echo.
echo ================================================================
echo   Check finished. Read the messages above.
echo ================================================================
pause
