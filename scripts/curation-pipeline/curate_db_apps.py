"""
curate_db_apps.py — Generate tasks for apps already in MongoDB.

Queries the 'apps' collection and generates 5 realistic tasks per app from the
app's name, category, and description via Claude Haiku/Sonnet. No existing candidate
tasks are involved — all output tasks are AI-generated.

Usage:
    # specific apps by package name
    python3 curate_db_apps.py --package-names "com.example.app1,com.example.app2"

    # specific apps by MongoDB ObjectId
    python3 curate_db_apps.py --app-ids "68abc123...,68def456..."

    # all iOS apps in the DB
    python3 curate_db_apps.py --os ios

    # resume a partial run
    python3 curate_db_apps.py --package-names "..." --resume

DATABASE_URL env var must be set (same connection string used by the Next.js app).
Override with --db-url.

Requires:
    pip install anthropic tqdm pymongo

Output schema (JSON array) — compatible with assign_tasks.py:
  {
    "id": str,           # MongoDB App _id
    "appId": str,        # same as id
    "appName": str,
    "category": str,
    "os": str,
    "meta": { "rating", "reviews", "genre", "url", "icon" },
    "selected": [ { "task": str, "generated": true } ]
  }
"""

import argparse
import asyncio
import json
import os
import sys
import time
from pathlib import Path
from urllib.parse import urlparse
from dotenv import load_dotenv

import anthropic
from bson import ObjectId
from pymongo import MongoClient
from tqdm.asyncio import tqdm_asyncio

load_dotenv()

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

MODEL = "claude-sonnet-4-6"  # "claude-haiku-4-5-20251001"
MAX_CONCURRENCY = 10
DEFAULT_RPM = 40
MAX_RETRIES = 4
RETRY_BASE_DELAY = 10.0
OUTPUT_DEFAULT = Path(__file__).parent / "curated-tasks-db.json"


# ---------------------------------------------------------------------------
# Token-bucket rate limiter
# ---------------------------------------------------------------------------


class TokenBucket:
    def __init__(self, rate_per_minute: int) -> None:
        self._rate = rate_per_minute / 60.0
        self._tokens = float(rate_per_minute)
        self._max = float(rate_per_minute)
        self._last_refill = time.monotonic()
        self._lock = asyncio.Lock()

    async def acquire(self) -> None:
        async with self._lock:
            now = time.monotonic()
            elapsed = now - self._last_refill
            self._tokens = min(self._max, self._tokens + elapsed * self._rate)
            self._last_refill = now
            if self._tokens >= 1.0:
                self._tokens -= 1.0
            else:
                wait = (1.0 - self._tokens) / self._rate
                self._tokens = 0.0
                await asyncio.sleep(wait)


# ---------------------------------------------------------------------------
# Prompt / tool schema
# ---------------------------------------------------------------------------

TOOL_SCHEMA = {
    "name": "submit_tasks",
    "description": "Submit the generated tasks for this app.",
    "input_schema": {
        "type": "object",
        "properties": {
            "tasks": {
                "type": "array",
                "minItems": 5,
                "maxItems": 5,
                "description": "Exactly 5 tasks for workers to complete.",
                "items": {
                    "type": "object",
                    "properties": {
                        "task": {
                            "type": "string",
                            "description": "The task description shown to the worker.",
                        },
                    },
                    "required": ["task"],
                },
            },
        },
        "required": ["tasks"],
    },
}

SYSTEM_PROMPT = """\
You are designing tasks for a mobile app usability study. \
Workers will screen-record themselves completing these tasks on a real iOS device. \
Each task must be a realistic action a typical user would do, covering at least 3 screens. \
Always write tasks in English, even if the app description is in another language."""

USER_PROMPT_TEMPLATE = """\
App: {name}
Category: {category}
Description (truncated to 2000 chars):
{description}

Generate exactly 5 tasks for a worker to complete in this app. Tasks must:
  • Be completable by any worker with no prior account history in the app.
  • Cover at least 3 screens each (no single-tap tasks).
  • Not require payment, subscription, or transferring real money.
  • Not require private data the worker won't have (e.g. "premium features locked behind a paywall").
  • Be timeless — no specific dates, no named sale events.
  • Use realistic names or search terms (not "test user", "sample item").
  • Do not use placeholder credentials — use generic phrasing instead
    (e.g. "log in using an email account", not "log in using testuser@gmail.com").
  • Keep each task under 75 characters — one clear, direct sentence.
  • Prefer practical flows: search, browse, filter, compare, share, save,
    configure settings (notifications, theme, language), account setup, login, favorites.

Call submit_tasks with the 5 tasks."""


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


def load_apps_from_db(
    db_url: str,
    app_ids: set[str],
    package_names: set[str],
    os_filter: str,
) -> list[dict]:
    client = MongoClient(db_url)
    db = client[_db_name_from_url(db_url)]
    col = db["apps"]

    query: dict = {}
    if os_filter:
        query["os"] = os_filter
    if app_ids:
        try:
            query["_id"] = {"$in": [ObjectId(aid) for aid in app_ids]}
        except Exception as exc:
            sys.exit(f"Invalid ObjectId in --app-ids: {exc}")
    if package_names:
        query["packageName"] = {"$in": list(package_names)}

    docs = list(col.find(query))
    client.close()

    entries = []
    for doc in docs:
        meta = doc.get("metadata") or {}
        category = doc.get("category") or {}
        entries.append(
            {
                "id": str(doc["_id"]),
                "appId": str(doc["_id"]),
                "packageName": doc.get("packageName", ""),
                "app": {
                    "metadata": {
                        "name": meta.get("name", ""),
                        "description": meta.get("description", ""),
                        "rating": meta.get("rating"),
                        "reviews": meta.get("reviews"),
                        "genre": meta.get("genre") or [],
                        "url": meta.get("url"),
                        "icon": meta.get("icon"),
                    },
                    "category": {"name": category.get("name", "")},
                    "os": doc.get("os", "ios"),
                },
            }
        )

    return entries


# ---------------------------------------------------------------------------
# Generation logic
# ---------------------------------------------------------------------------


async def generate_entry(
    client: anthropic.AsyncAnthropic,
    entry: dict,
    semaphore: asyncio.Semaphore,
    rate_limiter: TokenBucket,
) -> dict | None:
    meta = entry["app"]["metadata"]
    name = meta.get("name", "Unknown App")

    await rate_limiter.acquire()

    async with semaphore:
        response = None
        for attempt in range(MAX_RETRIES):
            try:
                response = await client.messages.create(
                    model=MODEL,
                    max_tokens=1024,
                    system=SYSTEM_PROMPT,
                    messages=[
                        {
                            "role": "user",
                            "content": USER_PROMPT_TEMPLATE.format(
                                name=name,
                                category=entry["app"]
                                .get("category", {})
                                .get("name", "Unknown"),
                                description=(meta.get("description") or "")[:2000],
                            ),
                        }
                    ],
                    tools=[TOOL_SCHEMA],
                    tool_choice={"type": "tool", "name": "submit_tasks"},
                )
                break
            except anthropic.RateLimitError:
                delay = RETRY_BASE_DELAY * (2**attempt)
                print(
                    f"\n[RATE LIMIT] {name}: waiting {delay:.0f}s "
                    f"(attempt {attempt + 1}/{MAX_RETRIES})",
                    file=sys.stderr,
                )
                if attempt == MAX_RETRIES - 1:
                    print(
                        f"\n[ERROR] {name}: gave up after rate-limit retries",
                        file=sys.stderr,
                    )
                    return None
                await asyncio.sleep(delay)
            except anthropic.APIStatusError as exc:
                if exc.status_code >= 500 and attempt < MAX_RETRIES - 1:
                    delay = RETRY_BASE_DELAY * (2**attempt)
                    print(
                        f"\n[RETRY] {name}: server error {exc.status_code}, "
                        f"waiting {delay:.0f}s",
                        file=sys.stderr,
                    )
                    await asyncio.sleep(delay)
                else:
                    print(f"\n[ERROR] {name}: {exc}", file=sys.stderr)
                    return None
            except Exception as exc:
                print(f"\n[ERROR] {name}: {exc}", file=sys.stderr)
                return None

    if response is None:
        return None

    tool_block = next((b for b in response.content if b.type == "tool_use"), None)
    if tool_block is None:
        print(f"\n[WARN] {name}: no tool call in response", file=sys.stderr)
        return None

    raw_tasks = tool_block.input.get("tasks", [])
    if isinstance(raw_tasks, str):
        try:
            raw_tasks = json.loads(raw_tasks)
        except json.JSONDecodeError:
            raw_tasks = []

    selected = [
        {"task": t["task"], "generated": True}
        for t in raw_tasks
        if isinstance(t, dict) and t.get("task")
    ]

    if len(selected) < 5:
        print(f"\n[WARN] {name}: only {len(selected)} tasks generated", file=sys.stderr)

    return {
        "id": entry["id"],
        "appId": entry["appId"],
        "appName": name,
        "category": entry["app"].get("category", {}).get("name", ""),
        "os": entry["app"].get("os", "ios"),
        "meta": {
            "rating": meta.get("rating"),
            "reviews": meta.get("reviews"),
            "genre": meta.get("genre") or [],
            "url": meta.get("url"),
            "icon": meta.get("icon"),
        },
        "selected": selected,
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


async def main(args: argparse.Namespace) -> None:
    db_url = args.db_url or os.environ.get("DATABASE_URL", "")
    if not db_url:
        sys.exit(
            "MongoDB connection string required: set DATABASE_URL or pass --db-url."
        )

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        sys.exit("ANTHROPIC_API_KEY environment variable is not set.")

    app_ids = (
        {a.strip() for a in args.app_ids.split(",") if a.strip()}
        if args.app_ids
        else set()
    )
    package_names = (
        {p.strip() for p in args.package_names.split(",") if p.strip()}
        if args.package_names
        else set()
    )

    print("Querying MongoDB…")
    data = load_apps_from_db(db_url, app_ids, package_names, args.os)
    print(f"Found {len(data)} apps.")

    if not data:
        print("Nothing to process.")
        return

    output_path = Path(args.output)
    already_done: set[str] = set()
    results: list[dict] = []
    if args.resume and output_path.exists():
        with open(output_path) as f:
            results = json.load(f)
        already_done = {r["id"] for r in results}
        print(f"Resuming: {len(already_done)} entries already processed.")

    pending = [e for e in data if e["id"] not in already_done]
    print(f"Processing {len(pending)} entries (skipping {len(already_done)}).")

    if not pending:
        print("All entries already processed.")
        return

    client = anthropic.AsyncAnthropic(api_key=api_key, max_retries=0)
    semaphore = asyncio.Semaphore(args.concurrency)
    rate_limiter = TokenBucket(args.rpm)
    print(f"Rate limit: {args.rpm} RPM | Concurrency: {args.concurrency}")

    coros = [
        generate_entry(client, entry, semaphore, rate_limiter) for entry in pending
    ]
    new_results = await tqdm_asyncio.gather(*coros, desc="Generating")

    for r in new_results:
        if r is not None:
            results.append(r)

    with open(output_path, "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    total_tasks = sum(len(r.get("selected", [])) for r in results)
    print(f"\nDone. {len(results)} apps → {output_path}")
    print(f"  Tasks generated: {total_tasks} total")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        default=str(OUTPUT_DEFAULT),
        help="Output JSON path (default: curated-tasks-db.json).",
    )
    parser.add_argument(
        "--app-ids",
        default="",
        help="Comma-separated MongoDB ObjectIds of apps to process.",
    )
    parser.add_argument(
        "--package-names",
        default="",
        help="Comma-separated package names (e.g. 'com.spotify.music,com.duolingo.duolingo').",
    )
    parser.add_argument(
        "--os",
        default="ios",
        help="Filter by OS (default: ios). Pass empty string for all.",
    )
    parser.add_argument(
        "--db-url",
        default="",
        help="MongoDB connection string. Falls back to DATABASE_URL env var.",
    )
    parser.add_argument(
        "--concurrency",
        type=int,
        default=MAX_CONCURRENCY,
        help="Max parallel API requests (default 10).",
    )
    parser.add_argument(
        "--rpm",
        type=int,
        default=DEFAULT_RPM,
        help="Max requests per minute (default 40).",
    )
    parser.add_argument(
        "--resume",
        action="store_true",
        help="Skip entries already present in the output file.",
    )
    args = parser.parse_args()
    asyncio.run(main(args))
