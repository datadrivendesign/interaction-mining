"""
generate_new_app_tasks.py — Generate candidate tasks for new apps using Claude Haiku.

Reads new-apps.json (output of scrape_appstore_apps.py) and generates 5–10
realistic candidate tasks per app, grounded in the App Store description and
real user reviews.

Usage:
    python3 generate_new_app_tasks.py [--input FILE] [--output FILE]
                                      [--concurrency N] [--rpm N] [--resume]

Requires:
    pip install anthropic python-dotenv tqdm
"""

import argparse
import asyncio
import json
import os
import sys
import time
from pathlib import Path

import anthropic
from dotenv import load_dotenv
from tqdm.asyncio import tqdm_asyncio

load_dotenv()

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

MODEL = "claude-haiku-4-5-20251001"
MAX_CONCURRENCY = 10
DEFAULT_RPM = 40
MAX_RETRIES = 4
RETRY_BASE_DELAY = 10.0
INPUT_DEFAULT = Path(__file__).parent / "new-apps.json"
OUTPUT_DEFAULT = Path(__file__).parent / "generated-tasks.json"

# ---------------------------------------------------------------------------
# Rate limiter (same implementation used across all pipeline scripts)
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
    "description": "Submit the generated candidate tasks for this app.",
    "input_schema": {
        "type": "object",
        "properties": {
            "tasks": {
                "type": "array",
                "minItems": 5,
                "maxItems": 10,
                "description": "5 to 10 candidate tasks for workers to complete.",
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

Recent user reviews (real feedback — use these to surface concrete features and flows):
{reviews_section}

Generate 5 to 10 candidate tasks for a worker to complete in this app. Tasks must:
  • Workers may create their own free account during the task if needed — account
    creation and login tasks are fully valid.
  • Cover at least 3 screens each (no single-tap tasks).
  • Not require payment, subscription, or transferring real money.
  • Not require private data the worker won't already have or could plausibly create.
  • Be timeless — no specific dates or named sale events.
  • Use realistic names or search terms (not "test user", "sample item").
  • Use generic credential phrasing (e.g. "create a free account", "sign in with email").
  • Keep each task under 110 characters — one clear, direct sentence.
  • Prefer practical flows: account creation, login, search, browse, filter, compare,
    share, save, configure settings (notifications, theme, language), favorites.
  • Draw on the user reviews to surface real features people actually interact with.

Generate more tasks (closer to 10) if the app clearly supports many distinct flows.
Call submit_tasks with your candidate list."""


def format_reviews(reviews: list[dict]) -> str:
    if not reviews:
        return "  (no reviews available)"
    lines = []
    for r in reviews:
        stars = "★" * r["rating"] + "☆" * (5 - r["rating"])
        title = r.get("title", "").strip()
        text = r.get("text", "").strip()[:300]
        entry = f'  {stars} "{title}"'
        if text:
            entry += f" — {text}"
        lines.append(entry)
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Core generation logic
# ---------------------------------------------------------------------------


async def generate_entry(
    client: anthropic.AsyncAnthropic,
    app: dict,
    semaphore: asyncio.Semaphore,
    rate_limiter: TokenBucket,
) -> dict | None:
    name = app.get("name", "Unknown App")

    await rate_limiter.acquire()

    async with semaphore:
        response = None
        for attempt in range(MAX_RETRIES):
            try:
                response = await client.messages.create(
                    model=MODEL,
                    max_tokens=1024,
                    system=SYSTEM_PROMPT,
                    messages=[{
                        "role": "user",
                        "content": USER_PROMPT_TEMPLATE.format(
                            name=name,
                            category=app.get("primaryGenre", "Unknown"),
                            description=(app.get("description") or "")[:2000],
                            reviews_section=format_reviews(app.get("userReviews", [])),
                        ),
                    }],
                    tools=[TOOL_SCHEMA],
                    tool_choice={"type": "tool", "name": "submit_tasks"},
                )
                break
            except anthropic.RateLimitError:
                delay = RETRY_BASE_DELAY * (2 ** attempt)
                print(
                    f"\n[RATE LIMIT] {name}: waiting {delay:.0f}s "
                    f"(attempt {attempt + 1}/{MAX_RETRIES})",
                    file=sys.stderr,
                )
                if attempt == MAX_RETRIES - 1:
                    print(f"\n[ERROR] {name}: gave up after rate-limit retries", file=sys.stderr)
                    return None
                await asyncio.sleep(delay)
            except anthropic.APIStatusError as exc:
                if exc.status_code >= 500 and attempt < MAX_RETRIES - 1:
                    delay = RETRY_BASE_DELAY * (2 ** attempt)
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

    tasks = [t["task"] for t in raw_tasks if isinstance(t, dict) and t.get("task")]

    if len(tasks) < 5:
        print(f"\n[WARN] {name}: only {len(tasks)} tasks generated", file=sys.stderr)

    return {
        "trackId":      app["trackId"],
        "bundleId":     app["bundleId"],
        "appName":      name,
        "company":      app.get("company", ""),
        # description + icon carried forward so curate and import scripts need only this file.
        "description":  (app.get("description") or "")[:2000],
        "icon":         app.get("icon", ""),
        "cover":        app.get("cover", ""),
        "primaryGenre": app.get("primaryGenre", ""),
        "genre":        app.get("genre", []),
        "url":          app.get("url"),
        "os":           "ios",
        "score":        app.get("score"),
        "meta": {
            "rating":  app.get("rating"),
            "reviews": app.get("reviews"),
            "genre":   app.get("genre", []),
            "url":     app.get("url"),
            "icon":    app.get("icon"),
        },
        "candidateTasks": tasks,
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


async def main(args: argparse.Namespace) -> None:
    input_path = Path(args.input)
    output_path = Path(args.output)

    with open(input_path) as f:
        raw = json.load(f)

    apps: list[dict] = raw["apps"] if isinstance(raw, dict) and "apps" in raw else raw
    print(f"Loaded {len(apps)} apps from {input_path}.")

    already_done: set[str] = set()
    results: list[dict] = []
    if args.resume and output_path.exists():
        with open(output_path) as f:
            results = json.load(f)
        already_done = {r["trackId"] for r in results}
        print(f"Resuming: {len(already_done)} entries already processed.")

    pending = [a for a in apps if a["trackId"] not in already_done]
    print(f"Processing {len(pending)} apps (skipping {len(already_done)}).")

    if not pending:
        print("Nothing to process.")
        return

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        sys.exit("ANTHROPIC_API_KEY environment variable is not set.")

    client = anthropic.AsyncAnthropic(api_key=api_key, max_retries=0)
    semaphore = asyncio.Semaphore(args.concurrency)
    rate_limiter = TokenBucket(args.rpm)
    print(f"Model: {MODEL} | Rate limit: {args.rpm} RPM | Concurrency: {args.concurrency}")

    coros = [generate_entry(client, app, semaphore, rate_limiter) for app in pending]
    new_results = await tqdm_asyncio.gather(*coros, desc="Generating")

    for r in new_results:
        if r is not None:
            results.append(r)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    total_tasks = sum(len(r.get("candidateTasks", [])) for r in results)
    print(f"\nDone. {len(results)} apps → {output_path}")
    print(f"  Candidate tasks generated: {total_tasks} total")
    avg = total_tasks / len(results) if results else 0
    print(f"  Average per app: {avg:.1f}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input", default=str(INPUT_DEFAULT),
        help="Path to new-apps.json (output of scrape_appstore_apps.py).",
    )
    parser.add_argument(
        "--output", default=str(OUTPUT_DEFAULT),
        help="Output JSON path (default: generated-tasks.json).",
    )
    parser.add_argument(
        "--concurrency", type=int, default=MAX_CONCURRENCY,
        help=f"Max parallel API requests (default {MAX_CONCURRENCY}).",
    )
    parser.add_argument(
        "--rpm", type=int, default=DEFAULT_RPM,
        help=f"Max requests per minute (default {DEFAULT_RPM}; Haiku tier-1 limit is 50).",
    )
    parser.add_argument(
        "--resume", action="store_true",
        help="Skip apps already present in the output file.",
    )
    args = parser.parse_args()
    asyncio.run(main(args))
