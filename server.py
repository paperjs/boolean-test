#!/usr/bin/env python
#
from wsgiref.simple_server import make_server

FILE = 'main.html'
PORT = 8080

def start_server():
    """Start the server."""
    httpd = make_server("", PORT, test_app)
    httpd.serve_forever()

if __name__ == "__main__":
    start_server()