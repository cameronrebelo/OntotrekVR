import http.server
import socketserver
import ssl

PORT = 8000
CERTIFICATE_FILE = 'server.pem'

Handler = http.server.SimpleHTTPRequestHandler

httpd = socketserver.TCPServer(("", PORT), Handler)
httpd.socket = ssl.wrap_socket(httpd.socket, certfile=CERTIFICATE_FILE, server_side=True)

print(f"Serving directory at https://localhost:{PORT}")
try:
    httpd.serve_forever()
except KeyboardInterrupt:
    print("Server is shutting down...")
    httpd.server_close()