#!/usr/bin/env python3
"""Fetch my top 5 Spotify tracks (last ~4 weeks) and write spotify.json for the homepage.

Runs weekly in GitHub Actions (.github/workflows/spotify.yml). Needs these env vars,
stored as repository secrets: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN.
Standard library only.
"""
import base64
import datetime as dt
import json
import os
import sys
import urllib.parse
import urllib.request

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "spotify.json")


def access_token(client_id, client_secret, refresh_token):
    body = urllib.parse.urlencode({"grant_type": "refresh_token", "refresh_token": refresh_token}).encode()
    auth = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    req = urllib.request.Request("https://accounts.spotify.com/api/token", data=body,
                                 headers={"Authorization": "Basic " + auth,
                                          "Content-Type": "application/x-www-form-urlencoded"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)["access_token"]


def top_tracks(token, limit=5):
    url = f"https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit={limit}"
    req = urllib.request.Request(url, headers={"Authorization": "Bearer " + token})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def simplify(payload, now=None):
    """Keep only what the page shows."""
    tracks = []
    for t in payload.get("items", []):
        images = sorted(t.get("album", {}).get("images", []), key=lambda i: i.get("width") or 0)
        # smallest image that's still at least 200px wide, else the largest available
        img = next((i["url"] for i in images if (i.get("width") or 0) >= 200), images[-1]["url"] if images else None)
        tracks.append({
            "name": t["name"],
            "artists": ", ".join(a["name"] for a in t.get("artists", [])),
            "album": t.get("album", {}).get("name"),
            "image": img,
            "url": t.get("external_urls", {}).get("spotify"),
        })
    now = now or dt.datetime.now(dt.timezone.utc)
    return {"updated": now.strftime("%Y-%m-%d"), "range": "last 4 weeks", "tracks": tracks}


def main():
    try:
        cid, secret, refresh = (os.environ[k] for k in ("SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET", "SPOTIFY_REFRESH_TOKEN"))
    except KeyError as e:
        sys.exit(f"missing env var {e}; set it as a repository secret")
    data = simplify(top_tracks(access_token(cid, secret, refresh)))
    if not data["tracks"]:
        sys.exit("Spotify returned no top tracks; keeping the previous spotify.json")
    old = None
    if os.path.exists(OUT):
        with open(OUT) as f:
            old = json.load(f)
    if old and old.get("tracks") == data["tracks"]:
        print("top tracks unchanged")
        return
    with open(OUT, "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    for i, t in enumerate(data["tracks"], 1):
        print(f"{i}. {t['name']} by {t['artists']}")


if __name__ == "__main__":
    main()
