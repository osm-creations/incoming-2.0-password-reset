from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os

os.chdir("public")
headers = [row.strip().split(": ", 1) for row in Path("_headers").read_text().splitlines() if row.startswith("  ")]
class Static(SimpleHTTPRequestHandler):
    def end_headers(self):
        for name, value in headers:
            self.send_header(name, value)
        super().end_headers()
ThreadingHTTPServer(("127.0.0.1",4289), Static).serve_forever()
