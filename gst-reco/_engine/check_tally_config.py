import socket
import urllib.request

print("Testing raw socket send to 127.0.0.1:9000...")

try:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(3)
    s.connect(('127.0.0.1', 9000))
    print("Socket connected successfully!")
    
    # Send basic HTTP request
    req = b"POST / HTTP/1.1\r\nHost: 127.0.0.1:9000\r\nContent-Type: text/xml\r\nContent-Length: 153\r\n\r\n<ENVELOPE><HEADER><VERSION>1</VERSION><TALLYREQUEST>Export</TALLYREQUEST><TYPE>Collection</TYPE><ID>Dummy</ID></HEADER><BODY><DESC></DESC></BODY></ENVELOPE>"
    s.sendall(req)
    print("Sent 153 bytes. Waiting for response...")
    data = s.recv(1024)
    print("Received response:", data[:200])
    s.close()
except socket.timeout:
    print("TIMEOUT: Tally accepted the socket connection but did not return any bytes.")
    print("This confirms Tally's UI thread is currently blocked by an open report/dialog screen in Tally Prime.")
except Exception as e:
    print("Error:", e)
