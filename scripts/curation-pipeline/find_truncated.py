"""
find_truncated.py — Find tasks that were hard-truncated at exactly 75 chars.

A task is flagged if:
  - Its length is exactly 75 characters (the old MAX_LEN), AND
  - It ends with an alphanumeric character (definitive sign of a mid-word cut)

Usage:
    python3 find_truncated.py                   # print flagged tasks + app IDs
    python3 find_truncated.py --app-ids-only    # print comma-separated app IDs for --app-ids
    python3 find_truncated.py --strip           # remove flagged apps from curated file in-place
"""

import argparse
import json
from pathlib import Path

CURATED = Path(__file__).parent / "candidate-task-apps-export-curated.json"
OLD_MAX = 75


def is_truncated(task: str) -> bool:
    # Exactly 75 chars ending in a letter/digit = old [:75] fallback sliced mid-word.
    return len(task) == OLD_MAX and task[-1].isalnum()


def main(args: argparse.Namespace) -> None:
    with open(args.input) as f:
        data = json.load(f)

    flagged_apps: dict[str, list[str]] = {}  # appId -> [task text, ...]
    flagged_app_names: dict[str, str] = {}

    for entry in data:
        app_id = entry.get("appId", "")
        for task in entry.get("selected", []):
            text = task["task"]
            if is_truncated(text):
                flagged_apps.setdefault(app_id, []).append(text)
                flagged_app_names[app_id] = entry.get("appName", "?")

    if not flagged_apps:
        print("No likely-truncated tasks found.")
        return

    total_tasks = sum(len(v) for v in flagged_apps.values())

    if args.app_ids_only:
        print(",".join(flagged_apps.keys()))
        return

    if args.strip:
        strip_ids = set(flagged_apps.keys())
        kept = [e for e in data if e.get("appId") not in strip_ids]
        with open(args.input, "w") as f:
            json.dump(kept, f, indent=2, ensure_ascii=False)
        print(f"Stripped {len(strip_ids)} apps ({total_tasks} truncated tasks) from {args.input}")
        print("Re-run curate_tasks.py with --app-ids:")
        print(",".join(strip_ids))
        return

    print(f"\nLikely-truncated tasks: {total_tasks} across {len(flagged_apps)} apps\n")
    for app_id, tasks in flagged_apps.items():
        print(f"  [{flagged_app_names[app_id]}]  ({app_id})")
        for t in tasks:
            print(f"    {len(t):>3} chars | {t}")
        print()

    print(f"─── {total_tasks} tasks in {len(flagged_apps)} apps. ───")
    print("Run with --strip to remove these apps and re-curate them.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", default=str(CURATED))
    parser.add_argument("--app-ids-only", action="store_true",
                        help="Print only the comma-separated app IDs (for --app-ids flag).")
    parser.add_argument("--strip", action="store_true",
                        help="Remove flagged apps from the curated file in-place.")
    args = parser.parse_args()
    main(args)
