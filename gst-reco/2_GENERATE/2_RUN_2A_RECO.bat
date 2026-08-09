@echo off
setlocal
title Step 2 - GSTR-2A Reconciliation
set ENGINE=%~dp0..\_engine

echo ================================================================
echo   STEP 2 - GSTR-2A RECONCILIATION  (books vs 2A)
echo ================================================================
echo.
echo   Tally does NOT need to be open - this is pure file work.
echo.
echo   BEFORE YOU RUN, put your GSTR-2A workbooks in  1_INPUT
echo   Name them so the financial year is visible, for example:
echo       JC 2A 25-26.xlsx        GSTR2A_2026-2027.xlsx
echo   The rest of the name does not matter - rename freely.
echo.
echo   Books come from 3_OUTPUT (step 1). Press Enter at each
echo   prompt to accept the file shown, or paste another path.
echo.
echo   FIRST TIME with a new 2A layout, check the column mapping:
echo       2b_CHECK_2A_COLUMNS.bat
echo.
echo   Writes GST_2A_Reco_FY*.xlsx into  3_OUTPUT
echo ================================================================
echo.

python "%ENGINE%\tally_2a_reco.py"
set RC=%ERRORLEVEL%

echo.
echo ================================================================
if "%RC%"=="0" (
  echo   Finished OK. Workbooks are in  3_OUTPUT
  echo   Next: run  3_VENDOR_SUMMARY.bat
) else (
  echo   Did not finish. Exit code %RC% - read the message above.
)
echo ================================================================
pause
