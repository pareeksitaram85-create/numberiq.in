================================================================================
  TALLY -> GSTR-2A RECONCILIATION           how to run it yourself
================================================================================

THE FOLDERS
-----------
  1_INPUT      you put files here      <- your GSTR-2A workbooks
  2_GENERATE   you double-click here   <- the buttons
  3_OUTPUT     results appear here     <- everything the scripts produce
  _engine      the python code         <- do not touch
  _archive     old / unused files      <- nothing here is needed

  Full detail, every rule and why it exists:  GST-RECO-MODULE-GUIDE.md


THE NORMAL RUN, IN ORDER
------------------------
  1_EXPORT_BOOKS.bat        Tally must be open on port 9000.
                            Pulls the GST purchase register out of Tally.
                            -> 3_OUTPUT\GST_Entries_*.xlsx

  2_RUN_2A_RECO.bat         Tally NOT needed. Matches books against 2A.
                            -> 3_OUTPUT\GST_2A_Reco_FY2025-26.xlsx
                            -> 3_OUTPUT\GST_2A_Reco_FY2026-27.xlsx

  3_VENDOR_SUMMARY.bat      Year-wise + vendor-wise ITC summary.
                            -> 3_OUTPUT\GST_Vendor_Summary_ByPeriod.xlsx

Optional:
  0_CHECK_TALLY_CONNECTION.bat  run first if an export cannot connect
  2b_CHECK_2A_COLUMNS.bat       run once when a 2A file arrives in a new
                                layout - reports which column was read as
                                what, and reconciles nothing
  4_LEDGER_EXPORT.bat           general ledger MIS, unrelated to 2A reco

The old 5_ANALYTICS_JSON.bat is RETIRED and sits in _archive. It wrote
gst_reco_master_data.json for the web module; that file carried real vendor
GSTINs and 24 crore of tax and reached a world-readable path once already.
The web module reads Supabase now. Do not bring the button back.


NAMING YOUR 2A FILES
--------------------
Put them in 1_INPUT. The financial year must be visible in the name; the
rest is free. All of these work:

    JC 2A 26-27.xlsx          GSTR2A_2026-2027 final.xlsx
    2a 2627 v3.xlsx           2A-2025-26-REVISED.xlsx

If two files claim the same year, the most recently modified one wins.
A file that names both years, or neither, is ignored.

At the prompts just press Enter to accept the file shown. To use a
different file, paste its full path. A path that does not exist falls
back to the detected file and says so.


WHEN A YEAR IS SKIPPED
----------------------
"SKIPPING FY2026-27 - missing: 2A - no file in 1_INPUT named for FY2026-27"
means the year token was not found in any filename in 1_INPUT. Rename the
file so the year shows.

This matters more than it looks: each year's reconciliation checks the
OTHER year's 2A to classify timing differences. If one year is skipped,
the other year reports timing as 0 and moves those invoices into AT RISK.
Always run both years together.


READING THE RESULT
------------------
GST_2A_Reco_FY*.xlsx, sheet "Overview", explains every line in plain words.

    matched                 in books and in 2A - ITC is safe
    timing (other yr)       in the adjacent year's 2A - a timing difference,
                            not a loss
    AT RISK                 in books, not in 2A anywhere - chase the vendor
    in 2A only              vendor filed it, we have not booked it
    RCM                     in 2A but we pay the tax, not the vendor

Two self-checks print at the end of each year and must both say OK:
    books identity   <total> vs <total>   OK
    no double-match:                      OK
If either says BROKEN, the workbook is not trustworthy - do not file from it.


THE THING THAT USED TO GO WRONG
-------------------------------
Output used to land on the Desktop, from about ten different hardcoded
paths, some writing two copies to two places. Everything now goes to
3_OUTPUT and the folder is defined once, in _engine\paths.py. Moving or
renaming this whole folder is safe - the paths follow it. That is how it
came to live inside the NumberIQ repo instead of C:\TallyExport.


THE DATA IN HERE IS NOT IN GIT, ON PURPOSE
------------------------------------------
This folder now sits inside a git repository. The code is versioned; the
2A workbooks in 1_INPUT and everything in 3_OUTPUT are NOT - .gitignore
blocks them. That is deliberate and it is the only thing standing between
real vendor GSTINs and a public GitHub repo. Do not "git add -f" them.
================================================================================
