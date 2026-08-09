@echo off
setlocal
title Check 2A column mapping (matches nothing)
set ENGINE=%~dp0..\_engine

echo ================================================================
echo   2A COLUMN MAPPING CHECK
echo ================================================================
echo.
echo   Reports which column of your 2A workbook was read as what.
echo   It reconciles NOTHING - it is a safety check to run the
echo   first time a 2A file arrives in a new layout.
echo.
echo   Read the report before trusting any reconciliation.
echo ================================================================
echo.

python "%ENGINE%\tally_2a_reco.py" --inspect
set RC=%ERRORLEVEL%

echo.
echo ================================================================
echo   Exit code %RC%. Mapping report is in  3_OUTPUT
echo ================================================================
pause
