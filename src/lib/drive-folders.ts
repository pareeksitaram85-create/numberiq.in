// The filing tree in Google Drive, under "ICAI Level 2 n8n Presentation".
// IDs are captured here so NumberIQ and the n8n workflow file documents into exactly the
// same folders — n8n reads the folderId straight off the classify response rather than
// searching Drive by name on every run.
//
// Filing location and processing are two separate questions. A purchase invoice is filed
// under "2.2 GST Other" but still goes through the Tally export; a GST notice is filed under
// "2.1 GST Notice" and goes through reply drafting. So `folder` and `docType` are both
// returned by /api/classify-document and must not be collapsed into one field.

export const DRIVE_ROOT_ID = "10CgJ5I2zhICaUMuTzZJW2dngszShFCe_";

export interface DriveFolder {
  key: string;
  name: string;
  id: string;
  parent: string;
  /** What belongs here, in the words the classifier prompt uses. */
  holds: string;
}

export const DRIVE_FOLDERS: DriveFolder[] = [
  {
    key: "it-notice",
    name: "1.1 IT Notice",
    id: "1A81a3cndyDrvfLo3sWK7Tu09jtgbDwRw",
    parent: "1. Income Tax",
    holds: "Income Tax notices, intimations and orders — 139(9), 143(1), 143(2), 148, 156, 245, TDS/TCS defaults, penalty and assessment orders, appeal communications.",
  },
  {
    key: "it-other",
    name: "1.2 IT Other",
    id: "1auaYih1grrMziyPhDD_e7bemgpKgixvt",
    parent: "1. Income Tax",
    holds: "Income Tax documents that are not notices — ITR acknowledgements, Form 16/16A, 26AS, AIS/TIS, challans, computations, tax audit reports.",
  },
  {
    key: "gst-notice",
    name: "2.1 GST Notice",
    id: "1GM2_Mvprp9J6pOV3s8Beym8jASKPvpmt",
    parent: "2. GST",
    holds: "GST notices and orders — ASMT-10, DRC-01, DRC-01A, DRC-07, REG-17, show-cause notices, GST assessment and appeal communications.",
  },
  {
    key: "gst-other",
    name: "2.2 GST Other",
    id: "1kF71AuvuEx49xV4geZ0SuuATAEZnDam4",
    parent: "2. GST",
    holds: "GST documents that are not notices, AND all purchase/sales invoices, bills, debit and credit notes — including anything destined for the Tally register.",
  },
  {
    key: "tp",
    name: "3.1 Transfer Pricing",
    id: "1xpv8aW_76CZbmY1-DTg3TqWOS_48-Vsb",
    parent: "3. International",
    holds: "Transfer pricing material — Form 3CEB, TP study reports, benchmarking analyses, APA and MAP correspondence, associated-enterprise agreements.",
  },
  {
    key: "intl-other",
    name: "3.2 Other",
    id: "1VGBNc4s9KtmbDakpysIFdE4NuqwEAz1G",
    parent: "3. International",
    holds: "Cross-border documents other than transfer pricing — Form 15CA/15CB, FEMA and RBI filings, tax residency certificates, DTAA correspondence, overseas entity records.",
  },
  {
    key: "mis",
    name: "4. MIS and Other Documents",
    id: "171vJ9cuyos8wXCuHBN002BOLud-VoNk6",
    parent: "(root)",
    holds: "Anything that fits none of the above — bank statements, ledgers, MIS reports, agreements, salary records, correspondence, marketing material.",
  },
];

export const FOLDER_KEYS = DRIVE_FOLDERS.map(f => f.key);

export const folderByKey = (key: string) =>
  DRIVE_FOLDERS.find(f => f.key === key) ?? DRIVE_FOLDERS[DRIVE_FOLDERS.length - 1];

/** The folder list rendered for the Gemini prompt. */
export const FOLDER_GUIDE = DRIVE_FOLDERS.map(f => `- "${f.key}" (${f.name}): ${f.holds}`).join("\n");
