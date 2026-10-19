"""Run: python3 -m unittest tools/test_update_spotify.py"""
import datetime as dt
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from update_spotify import simplify  # noqa: E402

SAMPLE = {"items": [
    {"name": "Song A", "artists": [{"name": "Artist 1"}, {"name": "Artist 2"}],
     "album": {"name": "Album A", "images": [
         {"url": "big", "width": 640}, {"url": "mid", "width": 300}, {"url": "small", "width": 64}]},
     "external_urls": {"spotify": "https://open.spotify.com/track/a"}},
    {"name": "Song B", "artists": [{"name": "Artist 3"}],
     "album": {"name": "Album B", "images": [{"url": "only", "width": 64}]},
     "external_urls": {}},
    {"name": "Song C", "artists": [], "album": {"name": "Album C", "images": []}},
]}


class SimplifyTest(unittest.TestCase):
    def test_fields(self):
        out = simplify(SAMPLE, now=dt.datetime(2026, 10, 19, tzinfo=dt.timezone.utc))
        self.assertEqual(out["updated"], "2026-10-19")
        a, b, c = out["tracks"]
        self.assertEqual(a, {"name": "Song A", "artists": "Artist 1, Artist 2", "album": "Album A",
                             "image": "mid", "url": "https://open.spotify.com/track/a"})
        self.assertEqual(b["image"], "only")     # falls back to the largest available
        self.assertIsNone(b["url"])
        self.assertIsNone(c["image"])
        self.assertEqual(c["artists"], "")

    def test_empty(self):
        self.assertEqual(simplify({"items": []})["tracks"], [])


if __name__ == "__main__":
    unittest.main()
