#!/usr/bin/env python3
"""Read-only Stitch MCP authentication and project-list connectivity check."""
import json
import os
import sys
import urllib.error
import urllib.request

ENDPOINT = "https://stitch.googleapis.com/mcp"


def parse_response(body):
    if not body.strip():
        return {}
    try:
        return json.loads(body)
    except json.JSONDecodeError:
        # Streamable HTTP may return a JSON-RPC response as an SSE event.
        for event in body.replace("\r\n", "\n").split("\n\n"):
            data = "\n".join(line[5:].lstrip() for line in event.splitlines() if line.startswith("data:"))
            if data:
                message = json.loads(data)
                if "result" in message or "error" in message:
                    return message
        raise ValueError("No JSON-RPC response received")


def check():
    key = os.environ.get("STITCH_API_KEY")
    if not key:
        print("STITCH_API_KEY is missing. Enter the key securely in environment settings; do not paste it into chat.", file=sys.stderr)
        return 2
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "X-Goog-Api-Key": key,
    }

    def request(payload):
        req = urllib.request.Request(ENDPOINT, data=json.dumps(payload).encode(), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=30) as response:
            session = response.headers.get("Mcp-Session-Id")
            if session:
                headers["Mcp-Session-Id"] = session
            reply = parse_response(response.read().decode("utf-8"))
        if "error" in reply:
            # Do not log raw server errors: these may contain request metadata.
            raise ValueError("MCP request failed (JSON-RPC error code %s)" % reply["error"].get("code", "unknown"))
        return reply.get("result", {})

    initialized = request({"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {
        "protocolVersion": "2024-11-05", "capabilities": {},
        "clientInfo": {"name": "documind-stitch-check", "version": "1.0.0"},
    }})
    headers["MCP-Protocol-Version"] = initialized.get("protocolVersion", "2024-11-05")
    request({"jsonrpc": "2.0", "method": "notifications/initialized"})
    result = request({"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}})
    names = [tool["name"] for tool in result.get("tools", [])]
    if "list_projects" not in names:
        raise ValueError("Connected, but the list_projects tool is unavailable")
    projects = request({"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "list_projects", "arguments": {}}})
    if projects.get("isError"):
        raise ValueError("MCP connected, but listing Stitch projects was rejected")
    print("Stitch MCP connected. %d tools available. Read-only list_projects request succeeded." % len(names))
    print("No project content was modified. This does not automatically register tools in an already-running Codex chat.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(check())
    except urllib.error.HTTPError as error:
        print("Stitch connection failed: HTTP %s. Check the network allowlist and Stitch key permissions." % error.code, file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError:
        print("Stitch connection failed: network/proxy access is unavailable. Allow stitch.googleapis.com and retry.", file=sys.stderr)
        sys.exit(1)
    except (ValueError, TimeoutError):
        print("Stitch connection validation failed. Check MCP endpoint availability and account access.", file=sys.stderr)
        sys.exit(1)
