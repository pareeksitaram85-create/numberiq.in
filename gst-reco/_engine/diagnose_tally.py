import socket
import requests
import sys

def check_port(port):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(2)
    result = s.connect_ex(('127.0.0.1', port))
    s.close()
    return result == 0

def probe_tally(port):
    url = f"http://127.0.0.1:{port}"
    xml = """<ENVELOPE><HEADER><VERSION>1</VERSION><TALLYREQUEST>Export</TALLYREQUEST><TYPE>Collection</TYPE><ID>ListofCompanies</ID></HEADER><BODY><DESC><TDL><TDLMESSAGE><COLLECTION NAME="ListofCompanies" ISMODIFY="No"><TYPE>Company</TYPE><FETCH>NAME</FETCH></COLLECTION></TDLMESSAGE></TDL></DESC></BODY></ENVELOPE>"""
    try:
        r = requests.post(url, data=xml.encode('utf-8'), headers={"Content-Type": "text/xml;charset=utf-8"}, timeout=5)
        return True, r.text[:300]
    except requests.exceptions.Timeout:
        return False, "TIMEOUT (Tally port is listening, but Tally is stuck on a dialog/modal screen)"
    except requests.exceptions.ConnectionError as e:
        return False, f"CONNECTION REFUSED ({e})"
    except Exception as e:
        return False, str(e)

print("=" * 70)
print(" TALLY PRIME CONNECTIVITY DIAGNOSTIC")
print("=" * 70)

found_port = None
for p in [9000, 9001, 9002, 9005, 9009]:
    isOpen = check_port(p)
    status = "OPEN" if isOpen else "CLOSED"
    print(f"Port {p}: {status}")
    if isOpen and not found_port:
        found_port = p

if not found_port:
    print("\nRESULT: Tally Prime HTTP API port is NOT listening on ports 9000, 9001, etc.")
    print("Action needed in Tally Prime:")
    print("  1. Press F1 (Help) > Settings > Connectivity")
    print("  2. Client/Server configuration:")
    print("     - TallyPrime acts as : Both")
    print("     - Enable ODBC        : Yes")
    print("     - Port               : 9000")
    print("  3. Restart Tally Prime")
else:
    print(f"\nProbing Tally on port {found_port}...")
    success, resp = probe_tally(found_port)
    if success:
        print("SUCCESS! Tally Prime responded cleanly:")
        print(resp)
    else:
        print("DIAGNOSIS:", resp)
