#!/usr/bin/env python3
"""Read-only Stitch MCP authentication and project-list connectivity check."""
import sys
from stitch_client import StitchClient, StitchError, parse_response


def check():
    client = StitchClient()
    tools = client.request("tools/list")
    names = [tool["name"] for tool in tools.get("tools", [])]
    if "list_projects" not in names:
        raise StitchError("Connected, but list_projects is unavailable.")
    client.call("list_projects", {})
    print("Stitch MCP connected. %d tools available. Read-only list_projects request succeeded." % len(names))
    print("No project content was modified. This does not automatically register tools in an already-running Codex chat.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(check())
    except (StitchError, ValueError, KeyError):
        print("Stitch authentication or network check failed. Verify STITCH_API_KEY and the environment network allowlist.", file=sys.stderr)
        sys.exit(2)
