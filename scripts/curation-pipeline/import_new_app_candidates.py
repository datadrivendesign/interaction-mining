"""
import_new_app_candidates.py — Import curated new apps into MongoDB.

Reads curated-tasks-new.json (output of curate_new_app_tasks.py) and for each
eligible app (requiresHardware=false, selected tasks ≥ 5):
  - Upserts an App document into the apps collection (by bundleId + os).
  - Creates a CandidateTaskApp document linked to that App.
  - Skips apps that already have a CandidateTaskApp record.

Run with --dry-run (default) to preview what would be imported without writing.
Pass --apply to commit changes to the database.

Usage:
    python3 import_new_app_candidates.py [--input FILE] [--db-url URL] [--apply]

Requires:
    pip install pymongo python-dotenv
"""

import argparse
import json
import os
import sys
from pathlib import Path
from urllib.parse import urlparse

from bson import ObjectId
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

INPUT_DEFAULT = Path(__file__).parent / "curated-tasks-new.json"
MIN_SELECTED_TASKS = 5

# ---------------------------------------------------------------------------
# MongoDB helpers
# ---------------------------------------------------------------------------


def _db_name_from_url(url: str) -> str:
    try:
        path = urlparse(url).path.lstrip("/")
        name = path.split("?")[0].split("/")[0]
        return name or "odim"
    except Exception:
        return "odim"


def connect(db_url: str):
    client = MongoClient(db_url)
    db = client[_db_name_from_url(db_url)]
    return client, db


# ---------------------------------------------------------------------------
# Document builders
# ---------------------------------------------------------------------------


def build_app_doc(entry: dict) -> dict:
    """Build the fields to insert/update for an App document."""
    meta = entry.get("meta", {})
    return {
        "os":          "ios",
        "packageName": entry["bundleId"],
        "__v":         0,
        "category": {
            "id":   entry.get("primaryGenre", ""),
            "name": entry.get("primaryGenre", ""),
        },
        "metadata": {
            "company":     entry.get("company", ""),
            "name":        entry.get("appName", ""),
            "cover":       entry.get("cover", ""),
            "description": entry.get("description", ""),
            "icon":        entry.get("icon", ""),
            "rating":      meta.get("rating") or 0.0,
            "reviews":     meta.get("reviews"),
            "genre":       meta.get("genre") or [],
            "downloads":   "",
            "url":         meta.get("url"),
        },
    }


# ---------------------------------------------------------------------------
# Import logic
# ---------------------------------------------------------------------------


def run_import(
    data: list[dict],
    db,
    dry_run: bool,
) -> None:
    apps_col       = db["apps"]
    candidates_col = db["candidate_task_apps"]

    skipped_hardware  = 0
    skipped_too_few   = 0
    skipped_exists    = 0
    inserted_apps     = 0
    matched_apps      = 0
    inserted_cands    = 0

    for entry in data:
        name = entry.get("appName", entry.get("bundleId", "?"))

        # ── Skip hardware-dependent apps ─────────────────────────────────────
        if entry.get("requiresHardware"):
            reason = entry.get("hardwareReason", "")
            print(f"  [SKIP hardware] {name} — {reason}")
            skipped_hardware += 1
            continue

        # ── Skip apps with too few curated tasks ─────────────────────────────
        selected = entry.get("selected", [])
        if len(selected) < MIN_SELECTED_TASKS:
            print(f"  [SKIP tasks<{MIN_SELECTED_TASKS}] {name} — only {len(selected)} selected")
            skipped_too_few += 1
            continue

        task_strings = [t["task"] for t in selected if isinstance(t, dict) and t.get("task")]

        if dry_run:
            # ── Dry run: resolve whether an App doc already exists ────────────
            existing_app = apps_col.find_one(
                {"packageName": entry["bundleId"], "os": "ios"},
                {"_id": 1},
            )
            app_id = existing_app["_id"] if existing_app else "(new)"
            existing_cand = candidates_col.find_one({"app": app_id}) if existing_app else None

            status = "update app" if existing_app else "insert app"
            if existing_cand:
                print(f"  [DRY-RUN skip exists] {name}")
                skipped_exists += 1
            else:
                print(
                    f"  [DRY-RUN {status}] {name} "
                    f"| {len(task_strings)} tasks | bundleId={entry['bundleId']}"
                )
                if existing_app:
                    matched_apps += 1
                else:
                    inserted_apps += 1
                inserted_cands += 1
            continue

        # ── Live run ─────────────────────────────────────────────────────────

        # Upsert the App document.
        app_doc = build_app_doc(entry)
        result = apps_col.find_one_and_update(
            {"packageName": entry["bundleId"], "os": "ios"},
            {"$setOnInsert": app_doc},
            upsert=True,
            return_document=True,  # returns the document after the operation
        )
        app_object_id = result["_id"]

        if result.get("packageName"):
            # Document existed before the upsert.
            matched_apps += 1
        else:
            inserted_apps += 1

        # Skip if a CandidateTaskApp already exists for this app.
        existing_cand = candidates_col.find_one({"app": app_object_id})
        if existing_cand:
            print(f"  [skip exists] {name}")
            skipped_exists += 1
            continue

        candidates_col.insert_one({
            "app":            app_object_id,
            "candidateTasks": task_strings,
            "isTaken":        False,
        })
        inserted_cands += 1
        print(f"  [imported] {name} | {len(task_strings)} tasks")

    print()
    print(f"Hardware-dependent skipped : {skipped_hardware}")
    print(f"Too few tasks skipped       : {skipped_too_few}")
    print(f"Already exists skipped      : {skipped_exists}")
    print(f"App docs inserted           : {inserted_apps}")
    print(f"App docs matched (existing) : {matched_apps}")
    print(f"CandidateTaskApp inserted   : {inserted_cands}")
    if dry_run:
        print()
        print("Dry run — no changes were written. Pass --apply to commit.")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main(args: argparse.Namespace) -> None:
    db_url = args.db_url or os.environ.get("DATABASE_URL", "")
    if not db_url:
        sys.exit("MongoDB connection string required: set DATABASE_URL or pass --db-url.")

    input_path = Path(args.input)
    with open(input_path) as f:
        data: list[dict] = json.load(f)

    print(f"Loaded {len(data)} entries from {input_path}.")

    dry_run = not args.apply
    if dry_run:
        print("Mode: DRY RUN (pass --apply to write to MongoDB)\n")
    else:
        print("Mode: LIVE — writing to MongoDB\n")

    client, db = connect(db_url)
    try:
        run_import(data, db, dry_run=dry_run)
    finally:
        client.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input", default=str(INPUT_DEFAULT),
        help="Path to curated-tasks-new.json (output of curate_new_app_tasks.py).",
    )
    parser.add_argument(
        "--db-url", default="",
        help="MongoDB connection string. Falls back to DATABASE_URL env var.",
    )
    parser.add_argument(
        "--apply", action="store_true",
        help="Write to MongoDB. Without this flag the script runs as a dry run.",
    )
    main(parser.parse_args())
