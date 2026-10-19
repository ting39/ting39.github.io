#!/usr/bin/env python3
"""One-time Spotify login for the homepage's "on repeat" section.

1. Create an app at https://developer.spotify.com/dashboard
   - Redirect URI: http://127.0.0.1:8888/callback   (exactly this)
   - API: Web API
2. Run:  python3 tools/spotify_login.py
   It asks for the app's Client ID and Client Secret, opens Spotify in your browser
   to approve read access to your top tracks, then stores all three values as
   GitHub repository secrets with `gh secret set`. Nothing is written to disk or printed.
"""
import base64
import getpass
import http.server
import json
import secrets
import subprocess
import sys
import threading
import urllib.parse
import urllib.request
import webbrowser

REPO = "ting39/ting39.github.io"
REDIRECT = "http://127.0.0.1:8888/callback"
SCOPE = "user-top-read"


def wait_for_code(state):
    result = {}

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            if not self.path.startswith("/callback"):
                self.send_response(404); self.end_headers(); return
            ok = q.get("state", [""])[0] == state and "code" in q
            result["code"] = q["code"][0] if ok else None
            result["error"] = q.get("error", [None])[0]
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            msg = "Done. You can close this tab and go back to the terminal." if ok else "Login failed or was cancelled."
            self.wfile.write(f"<body style='font:20px sans-serif;padding:40px'>{msg}</body>".encode())
            threading.Thread(target=self.server.shutdown, daemon=True).start()

        def log_message(self, *a):
            pass

    srv = http.server.HTTPServer(("127.0.0.1", 8888), Handler)
    srv.serve_forever()
    return result


def post_token(cid, secret, data):
    auth = base64.b64encode(f"{cid}:{secret}".encode()).decode()
    req = urllib.request.Request("https://accounts.spotify.com/api/token",
                                 data=urllib.parse.urlencode(data).encode(),
                                 headers={"Authorization": "Basic " + auth,
                                          "Content-Type": "application/x-www-form-urlencoded"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def main():
    print("Spotify login for", REPO)
    cid = input("Client ID: ").strip()
    secret = getpass.getpass("Client Secret (hidden): ").strip()
    if not cid or not secret:
        sys.exit("Both are required.")

    state = secrets.token_urlsafe(16)
    url = "https://accounts.spotify.com/authorize?" + urllib.parse.urlencode({
        "client_id": cid, "response_type": "code", "redirect_uri": REDIRECT, "scope": SCOPE, "state": state})
    print("\nOpening Spotify in your browser to approve access…")
    print("If it doesn't open, visit:\n" + url + "\n")
    webbrowser.open(url)
    res = wait_for_code(state)
    if not res.get("code"):
        sys.exit(f"No authorization code received ({res.get('error') or 'state mismatch'}).")

    tok = post_token(cid, secret, {"grant_type": "authorization_code", "code": res["code"], "redirect_uri": REDIRECT})
    req = urllib.request.Request("https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=5",
                                 headers={"Authorization": "Bearer " + tok["access_token"]})
    with urllib.request.urlopen(req, timeout=30) as r:
        items = json.load(r).get("items", [])
    print("Login worked. Your current top 5:")
    for i, t in enumerate(items, 1):
        print(f"  {i}. {t['name']} by {', '.join(a['name'] for a in t['artists'])}")
    if not items:
        print("  (none yet; Spotify needs some listening history first)")

    if input(f"\nSave the 3 values as GitHub secrets on {REPO}? [Y/n] ").strip().lower() not in ("", "y", "yes"):
        sys.exit("Not saved.")
    for name, value in (("SPOTIFY_CLIENT_ID", cid), ("SPOTIFY_CLIENT_SECRET", secret),
                        ("SPOTIFY_REFRESH_TOKEN", tok["refresh_token"])):
        subprocess.run(["gh", "secret", "set", name, "-R", REPO], input=value.encode(), check=True,
                       stdout=subprocess.DEVNULL)
        print("  saved", name)

    if input("\nRun the update now so the homepage shows them right away? [Y/n] ").strip().lower() in ("", "y", "yes"):
        subprocess.run(["gh", "workflow", "run", "spotify.yml", "-R", REPO], check=True)
        print("Started. The homepage updates in about 1-2 minutes.")


if __name__ == "__main__":
    main()
