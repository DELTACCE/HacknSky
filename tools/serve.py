#!/usr/bin/env python3
"""Tiny local server. ES modules do not load from file://, so serve the folder:  python3 serve.py [port]"""
import http.server, socketserver, sys, os
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
class H(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, ".js": "text/javascript", ".mjs": "text/javascript", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml"}
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache"); super().end_headers()
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public"))
with socketserver.TCPServer(("", PORT), H) as s:
    print(f"HacknSky running at http://localhost:{PORT}  (Ctrl+C to stop)"); s.serve_forever()
