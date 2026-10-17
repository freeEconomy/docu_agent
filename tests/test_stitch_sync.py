"""Offline integration checks: all-or-nothing downloads and credential isolation."""
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest
import urllib.error
from email.message import Message

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))
from stitch_client import StitchClient, StitchError, parse_response

spec = importlib.util.spec_from_file_location("stitch_sync", SCRIPTS / "stitch-sync.py")
sync_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync_module)


class FakeClient:
    fail = False

    def call(self, name, args):
        if name == "get_project":
            return {"title": "Test design"}
        if name == "list_screens":
            return {"screens": [{"name": "projects/123/screens/abc"}]}
        return {"title": "Chat", "htmlCode": {"downloadUrl": "https://stitch.googleapis.com/html"}, "screenshot": {"downloadUrl": "https://lh3.googleusercontent.com/image"}}

    def download(self, url):
        if url.endswith("html") or url.endswith(":download"):
            return b"<!doctype html><html>new design</html>"
        if self.fail:
            raise StitchError("Download failed")
        return b"\x89PNG\r\n\x1a\nmock-png"


class SyncTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / ".stitch").mkdir()
        self.config = {"projectId": "123", "screens": {"abc": "design/chat"}}
        self.save_config()

    def save_config(self):
        (self.root / ".stitch/project.json").write_text(json.dumps(self.config))

    def test_check_is_read_only_and_second_sync_is_idempotent(self):
        self.assertEqual(sync_module.sync(self.root, FakeClient(), check=True), 1)
        self.assertFalse((self.root / "design").exists())
        self.assertFalse((self.root / ".stitch/snapshot.json").exists())
        self.assertEqual(sync_module.sync(self.root, FakeClient()), 0)
        self.assertEqual(sync_module.sync(self.root, FakeClient(), check=True), 0)
        manifest = (self.root / ".stitch/snapshot.json").read_text()
        self.assertNotIn("https://", manifest)
        self.assertNotIn("API_KEY", manifest)

    def test_html_only_keeps_existing_screenshot(self):
        screenshot = self.root / "design/chat/screen.png"
        screenshot.parent.mkdir(parents=True)
        screenshot.write_bytes(b"existing screenshot")
        client = FakeClient()
        client.fail = True
        self.assertEqual(sync_module.sync(self.root, client, html_only=True), 0)
        self.assertEqual(screenshot.read_bytes(), b"existing screenshot")
        self.assertEqual(sync_module.sync(self.root, client, check=True, html_only=True), 0)

    def test_file_api_wrapped_exports(self):
        import base64
        html = json.dumps({"dataString": "<html>한글</html>"}).encode()
        self.assertEqual(sync_module.decode_export(html, "htmlCode"), "<html>한글</html>".encode())
        png = b"\x89PNG\r\n\x1a\nimage"
        image = json.dumps({"dataString": base64.b64encode(png).decode(), "imageMetadata": {"mimeType": "image/png"}}).encode()
        self.assertEqual(sync_module.decode_export(image, "screenshot"), png)
        with self.assertRaises(StitchError):
            sync_module.decode_export(b'{"dataString":"bad","imageMetadata":{"mimeType":"image/jpeg"}}', "screenshot")

    def test_failed_download_preserves_existing_export(self):
        target = self.root / "design/chat/code.html"
        target.parent.mkdir(parents=True)
        target.write_text("original")
        client = FakeClient()
        client.fail = True
        with self.assertRaises(StitchError):
            sync_module.sync(self.root, client)
        self.assertEqual(target.read_text(), "original")
        self.assertFalse((self.root / ".stitch/snapshot.json").exists())

    def test_path_escape_is_rejected(self):
        self.config["screens"]["abc"] = "../elsewhere"
        self.save_config()
        with self.assertRaises(StitchError):
            sync_module.sync(self.root, FakeClient())

    def test_symlink_outside_design_is_rejected(self):
        (self.root / "design").mkdir()
        (self.root / "outside").mkdir()
        (self.root / "design/chat").symlink_to(self.root / "outside", target_is_directory=True)
        with self.assertRaises(StitchError):
            sync_module.sync(self.root, FakeClient())

    def test_json_and_sse_responses(self):
        for body in ['{"result":{"tools":[]}}', 'event: message\r\ndata: {"result":{"tools":[]}}\r\n\r\n']:
            self.assertEqual(parse_response(body)["result"], {"tools": []})

    def test_redirect_to_cdn_does_not_forward_api_key(self):
        requests = []

        class Response:
            def __enter__(self): return self
            def __exit__(self, *args): return False
            def read(self, limit): return b"asset"

        class Opener:
            def open(self, request, timeout):
                requests.append(request)
                if len(requests) == 1:
                    headers = Message()
                    headers["Location"] = "https://lh3.googleusercontent.com/image"
                    raise urllib.error.HTTPError(request.full_url, 302, "redirect", headers, None)
                return Response()

        client = StitchClient.__new__(StitchClient)
        client.key = "offline-test-fixture"
        client.opener = Opener()
        self.assertEqual(client.download("https://stitch.googleapis.com/image"), b"asset")
        self.assertTrue(any(name.lower() == "x-goog-api-key" for name, _ in requests[0].header_items()))
        self.assertFalse(any(name.lower() == "x-goog-api-key" for name, _ in requests[1].header_items()))

    def test_unapproved_asset_host_is_rejected(self):
        client = StitchClient.__new__(StitchClient)
        with self.assertRaises(StitchError):
            client.download("https://unapproved.invalid/export")


if __name__ == "__main__":
    unittest.main()
