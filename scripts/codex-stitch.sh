#!/usr/bin/env bash
set -euo pipefail
# CLI overrides also work when a managed environment cannot load project config.
if [[ -z "${STITCH_API_KEY:-}" ]]; then
  printf '%s\n' 'STITCH_API_KEY is missing. Add it securely in environment settings, then restart the task.' >&2
  exit 2
fi
exec codex \
  -c 'mcp_servers.stitch.url="https://stitch.googleapis.com/mcp"' \
  -c 'mcp_servers.stitch.env_http_headers={"X-Goog-Api-Key"="STITCH_API_KEY"}' \
  -c 'mcp_servers.stitch.startup_timeout_sec=30' \
  -c 'mcp_servers.stitch.tool_timeout_sec=120' \
  "$@"
