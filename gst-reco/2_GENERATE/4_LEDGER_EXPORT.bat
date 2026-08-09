@echo off
setlocal
title Tally Ledger Export (general, not part of 2A reco)
set ENGINE=%~dp0..\_engine
set OUT=%~dp0..\3_OUTPUT
if not exist "%OUT%" mkdir "%OUT%"
set LOG=%OUT%\tally_export_log.txt

echo ================================================================
echo   TALLY LEDGER EXPORT  (general MIS - independent of 2A reco)
echo ================================================================
echo.
echo   Tally must be running on port 9000 with the company loaded.
echo   Writes Tally_*.xlsx into  3_OUTPUT
echo ================================================================
echo.

echo ================================================ > "%LOG%"
echo  TALLY LEDGER EXPORT - run at %DATE% %TIME%      >> "%LOG%"
echo ================================================ >> "%LOG%"
echo. >> "%LOG%"

python "%ENGINE%\tally_ledger_export.py" >> "%LOG%" 2>&1
set RC=%ERRORLEVEL%

echo. >> "%LOG%"
echo EXITCODE=%RC% >> "%LOG%"
echo. >> "%LOG%"
echo --- Files now in 3_OUTPUT --- >> "%LOG%"
dir /b /o-d "%OUT%\Tally_*.xlsx" >> "%LOG%" 2>&1

type "%LOG%"
echo.
echo ================================================================
echo   Finished. Exit code %RC%.  Log: %LOG%
echo ================================================================
pause
