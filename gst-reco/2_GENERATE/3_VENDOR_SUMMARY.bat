@echo off
setlocal
title Step 3 - Year-wise and Vendor-wise ITC Summary
set ENGINE=%~dp0..\_engine

echo ================================================================
echo   STEP 3 - YEAR-WISE + VENDOR-WISE ITC SUMMARY
echo ================================================================
echo.
echo   Builds one workbook from the step 2 reconciliations:
echo     01_ONE_PAGE_ALL_GSTIN   one row per vendor, all states,
echo                             both years side by side + total
echo     02/03 State_Summary     per state GSTIN, one per year
echo     05/06 Vendors by year   vendor x state
echo     07    Vendors TOTAL
echo     CHK_* checks            duplicates, rate plausibility,
echo                             s.16(4) time limit, s.17(5)
echo.
echo   Vendors are keyed on PAN, not GSTIN, so one vendor billing
echo   from 18 states stays a single row.
echo.
echo   Writes GST_Vendor_Summary_ByPeriod.xlsx into  3_OUTPUT
echo ================================================================
echo.

python "%ENGINE%\vendor_state_summary.py"
set RC=%ERRORLEVEL%

echo.
echo ================================================================
if "%RC%"=="0" (
  echo   Finished OK. Workbook is in  3_OUTPUT
) else (
  echo   Did not finish. Exit code %RC% - read the message above.
)
echo ================================================================
pause
