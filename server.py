import http.server
import socketserver

ALLOWED_FILES = {
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/schedule.json',
    '/icon.png',
}

PORT = 3000

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split('?')[0]
        if path not in ALLOWED_FILES:
            self.send_error(404, "Not Found")
            return
        if path == '/':
            path = '/index.html'
        self.path = path
        return super().do_GET()

    def list_directory(self, path):
        self.send_error(404, "Not Found")
        return None

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, format, *args):
        pass

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Сервер запущен на http://localhost:{PORT}")
    httpd.serve_forever()
