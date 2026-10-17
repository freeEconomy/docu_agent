"""Small read-only Stitch MCP client. No third-party dependencies or credential files."""
import json
import os
import urllib.error
import urllib.request
from urllib.parse import urlsplit

ENDPOINT = "https://stitch.googleapis.com/mcp"
ASSET_HOSTS = frozenset({"stitch.googleapis.com", "contribution.usercontent.google.com", "lh3.googleusercontent.com"})
MAX_ASSET_BYTES = 20 * 1024 * 1024


class StitchError(Exception):
    pass


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def parse_response(body):
    if not body.strip():
        return {}
    try:
        return json.loads(body)
    except json.JSONDecodeError:
        for event in body.replace("\r\n", "\n").split("\n\n"):
            data = "\n".join(line[5:].lstrip() for line in event.splitlines() if line.startswith("data:"))
            if data:
                message = json.loads(data)
                if "result" in message or "error" in message:
                    return message
        raise StitchError("No JSON-RPC response received")


class StitchClient:
    def __init__(self):
        self.key = os.environ.get("STITCH_API_KEY")
        if not self.key:
            raise StitchError("STITCH_API_KEY is missing. Enter it securely in environment settings.")
        self.opener = urllib.request.build_opener(NoRedirect)
        self.headers = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream", "X-Goog-Api-Key": self.key}
        self.sequence = 0
        result = self.request("initialize", {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "documind-stitch-sync", "version": "1.0.0"}})
        self.headers["MCP-Protocol-Version"] = result.get("protocolVersion", "2024-11-05")
        self.request("notifications/initialized", notification=True)

    def request(self, method, params=None, notification=False):
        payload = {"jsonrpc": "2.0", "method": method}
        if params is not None:
            payload["params"] = params
        if not notification:
            self.sequence += 1
            payload["id"] = self.sequence
        req = urllib.request.Request(ENDPOINT, data=json.dumps(payload).encode(), headers=self.headers, method="POST")
        try:
            with self.opener.open(req, timeout=30) as response:
                session = response.headers.get("Mcp-Session-Id")
                if session:
                    self.headers["Mcp-Session-Id"] = session
                reply = parse_response(response.read().decode())
        except urllib.error.HTTPError as error:
            raise StitchError("Stitch MCP returned HTTP %s. Check account access and network settings." % error.code) from None
        except (urllib.error.URLError, TimeoutError):
            raise StitchError("Cannot reach stitch.googleapis.com through the current network.") from None
        if "error" in reply:
            raise StitchError("MCP request failed (code %s)." % reply["error"].get("code", "unknown"))
        if not notification and "result" not in reply:
            raise StitchError("MCP response is missing a result.")
        return reply.get("result", {})

    def call(self, name, arguments):
        # This integration only reads Stitch; generated screens are never modified.
        if name not in {"list_projects", "get_project", "list_screens", "get_screen"}:
            raise StitchError("Only read-only Stitch tools are supported.")
        result = self.request("tools/call", {"name": name, "arguments": arguments})
        if result.get("isError"):
            raise StitchError("Stitch rejected the %s request." % name)
        if result.get("structuredContent") is not None:
            return result["structuredContent"]
        for block in result.get("content", []):
            if block.get("type") == "text":
                try:
                    return json.loads(block["text"])
                except (json.JSONDecodeError, KeyError):
                    raise StitchError("Stitch returned an unexpected payload.") from None
        raise StitchError("Stitch response has no readable content.")

    def download(self, url):
        for _ in range(6):
            parsed = urlsplit(url)
            if parsed.scheme != "https" or parsed.hostname not in ASSET_HOSTS or parsed.username or parsed.password or parsed.port not in (None, 443):
                raise StitchError("Asset URL is outside the supported HTTPS Google hosts.")
            # API keys are never forwarded to asset CDNs or across redirects.
            headers = {"Accept": "*/*"}
            if parsed.hostname == "stitch.googleapis.com":
                headers["X-Goog-Api-Key"] = self.key
            req = urllib.request.Request(url, headers=headers)
            try:
                with self.opener.open(req, timeout=30) as response:
                    data = response.read(MAX_ASSET_BYTES + 1)
                if not data or len(data) > MAX_ASSET_BYTES:
                    raise StitchError("An exported file is empty or exceeds 20MB.")
                return data
            except urllib.error.HTTPError as error:
                if error.code in {301, 302, 303, 307, 308} and error.headers.get("Location"):
                    from urllib.parse import urljoin
                    url = urljoin(url, error.headers["Location"])
                    continue
                raise StitchError("Asset host %s returned HTTP %s." % (parsed.hostname, error.code)) from None
            except (urllib.error.URLError, TimeoutError):
                raise StitchError("Cannot download from %s. Check the environment network allowlist." % parsed.hostname) from None
        raise StitchError("Too many asset redirects.")
