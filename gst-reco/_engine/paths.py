"""Single source of truth for where files are read from and written to.

Every folder is derived from this file's own location, so the whole
C:\\TallyExport tree can be moved or renamed and everything still works.

    1_INPUT     you drop files here      (GSTR-2A workbooks off the portal)
    2_GENERATE  the .bat buttons
    3_OUTPUT    everything the scripts produce
    _engine     this code
    _archive    old / unused files
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

INPUT_DIR = os.path.join(ROOT, "1_INPUT")
GENERATE_DIR = os.path.join(ROOT, "2_GENERATE")
OUTPUT_DIR = os.path.join(ROOT, "3_OUTPUT")
ENGINE_DIR = os.path.join(ROOT, "_engine")
ARCHIVE_DIR = os.path.join(ROOT, "_archive")


def ensure_output():
    """Create the output folder on demand and return it."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    return OUTPUT_DIR
