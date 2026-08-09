@echo off
setlocal
title Step 1 - GST Purchase Register (books) from Tally
set ENGINE=%~dp0..\_engine

echo ================================================================
echo   STEP 1 - GST PURCHASE REGISTER (books), STATE/GSTIN WISE
echo ================================================================
echo.
echo   Tally checklist before you continue:
echo     1. Title bar must read   TallyPrime Edit Log:9000
echo     2. Company loaded, and you are logged in
echo     3. You are on the "Gateway of Tally" screen
echo.
echo   If Tally runs out of memory part way through, just restart
echo   Tally and run this again - finished months are cached and
echo   will be skipped.
echo.
echo   Writes GST_Entries_*.xlsx into  3_OUTPUT
echo ================================================================
echo.

python "%ENGINE%\tally_gst_entries.py"
set RC=%ERRORLEVEL%

echo.
echo ================================================================
if "%RC%"=="0" (
  echo   Finished OK. Workbook is in  3_OUTPUT
  echo   Next: run  2_RUN_2A_RECO.bat
) else (
  echo   Did not finish. Exit code %RC% - read the message above.
)
echo ================================================================
pause
