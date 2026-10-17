#!/usr/bin/env python3
"""Download configured Stitch HTML/PNG exports for GitHub review, without a ZIP."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import sys
import tempfile

from stitch_client import StitchClient, StitchError

ROOT = Path(__file__).resolve().parents[1]


def destination(root, relative):
    path = (root / relative).resolve()
    if not path.is_relative_to((root / "design").resolve()) or path == (root / "design").resolve():
        raise StitchError("Every screen destination must be a subdirectory of design/.")
    return path


def sync(root, client, check=False):
    config = json.loads((root / ".stitch/project.json").read_text())
    project_id = config["projectId"]
    if not isinstance(project_id, str) or not project_id.isdigit():
        raise StitchError("The configured projectId must contain digits only.")
    mapping = config["screens"]
    if not isinstance(mapping, dict) or not mapping:
        raise StitchError("Configure at least one screen in .stitch/project.json.")
    paths = set()
    for screen_id, relative in mapping.items():
        if not re.fullmatch(r"[A-Za-z0-9_-]+", screen_id):
            raise StitchError("Invalid configured screen ID.")
        path = destination(root, relative)
        if path in paths or any(path.is_relative_to(p) or p.is_relative_to(path) for p in paths):
            raise StitchError("Screen output directories must not overlap.")
        paths.add(path)
    project = client.call("get_project", {"name": "projects/" + project_id})
    available = client.call("list_screens", {"projectId": project_id}).get("screens", [])
    names = {screen["name"] for screen in available}
    manifest = {"projectId": project_id, "title": project.get("title", config.get("title", "")), "screens": []}
    changed = []
    # Prepare every file first. A failed download leaves existing exports untouched.
    with tempfile.TemporaryDirectory(prefix="documind-stitch-") as temp:
        staged = []
        for index, (screen_id, relative) in enumerate(mapping.items()):
            name = "projects/%s/screens/%s" % (project_id, screen_id)
            if name not in names:
                raise StitchError("A configured screen is missing from the Stitch project; no files were changed.")
            screen = client.call("get_screen", {"name": name})
            entry = {"screenId": screen_id, "title": screen.get("title", ""), "directory": relative, "sha256": {}}
            for field, filename in [("htmlCode", "code.html"), ("screenshot", "screen.png")]:
                url = screen.get(field, {}).get("downloadUrl")
                if not url:
                    raise StitchError("An exported screen has no download URL; no files were changed.")
                data = client.download(url)
                if filename.endswith(".png") and not data.startswith(b"\x89PNG\r\n\x1a\n"):
                    raise StitchError("Stitch screenshot is not a valid PNG; no files were changed.")
                if filename.endswith(".html") and b"<html" not in data.lower():
                    raise StitchError("Stitch HTML export is invalid; no files were changed.")
                entry["sha256"][filename] = hashlib.sha256(data).hexdigest()
                target = destination(root, relative) / filename
                if target.is_symlink():
                    raise StitchError("Refusing to overwrite a symlink export.")
                if not target.exists() or target.read_bytes() != data:
                    changed.append(str(target.relative_to(root)))
                    source = Path(temp) / (str(index) + "-" + filename)
                    source.write_bytes(data)
                    staged.append((source, target))
            manifest["screens"].append(entry)
        # Do not persist API keys, signed download URLs, timestamps or account metadata.
        target = root / ".stitch/snapshot.json"
        data = (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode()
        if not target.exists() or target.read_bytes() != data:
            changed.append(".stitch/snapshot.json")
            source = Path(temp) / "snapshot.json"
            source.write_bytes(data)
            staged.append((source, target))
        if not check:
            for source, target in staged:
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(source.read_bytes())
    print("Verified %d Stitch screens. %d changed files%s." % (len(mapping), len(changed), " (check only)" if check else ""))
    for path in changed:
        print(path)
    return 1 if check and changed else 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Report changes without writing files; exit 1 when exports differ.")
    args = parser.parse_args()
    try:
        return sync(ROOT, StitchClient(), check=args.check)
    except (StitchError, OSError, ValueError, KeyError, TypeError) as error:
        # Never print raw server replies, credential values or signed asset URLs.
        message = str(error) if isinstance(error, StitchError) else "Invalid local configuration or export data."
        print("Stitch sync failed: " + message, file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
