"""
curate_tasks.py — Clean and curate candidate tasks for the interaction mining study.

For each app:
  - Classifies candidates as valid, paywall, duplicate, or invalid.
  - Keeps all valid tasks (no upper cap; >5 is fine).
  - Generates extras from app metadata if fewer than 5 valid tasks remain.
  - Emits a "selected" list (shown to workers) and a "flagged" list (for review).

Usage:
    python3 curate_tasks.py [--input FILE] [--output FILE] [--concurrency N] [--rpm N] [--resume]

Requires:
    pip install anthropic tqdm   (or: uv pip install anthropic tqdm)

Output schema (JSON array):
  {
    "id": str,
    "appId": str,
    "appName": str,
    "category": str,
    "os": str,
    "selected": [                   # shown to workers
      { "task": str, "generated": bool }
    ],
    "flagged": [                    # excluded, kept for reference
      { "task": str, "reason": "paywall" | "duplicate" | "invalid" | "non-english" }
    ]
  }
"""

import argparse
import asyncio
import json
import os
import sys
import time
from pathlib import Path

import anthropic
from tqdm.asyncio import tqdm_asyncio

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

MODEL = "claude-haiku-4-5-20251001"
MAX_CONCURRENCY = 10
DEFAULT_RPM = 40          # stay safely under Haiku's 50 RPM tier-1 limit
MAX_RETRIES = 4           # retries on 429 / transient errors
RETRY_BASE_DELAY = 10.0   # seconds; doubles each attempt (10, 20, 40, 80)
INPUT_DEFAULT = Path(__file__).parent / "candidate-task-apps-filtered.json"
OUTPUT_DEFAULT = Path(__file__).parent / "curated-tasks.json"


# ---------------------------------------------------------------------------
# Token-bucket rate limiter
# ---------------------------------------------------------------------------


class TokenBucket:
    """Async token bucket that caps outbound requests to `rate_per_minute`."""

    def __init__(self, rate_per_minute: int) -> None:
        self._rate = rate_per_minute / 60.0   # tokens refilled per second
        self._tokens = float(rate_per_minute)  # start full
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
                # How long until we accumulate one token?
                wait = (1.0 - self._tokens) / self._rate
                self._tokens = 0.0
                await asyncio.sleep(wait)

TOOL_SCHEMA = {
    "name": "submit_curated_tasks",
    "description": "Submit the curated task lists for this app.",
    "input_schema": {
        "type": "object",
        "properties": {
            "selected": {
                "type": "array",
                "minItems": 5,
                "description": (
                    "Tasks to show workers. At least 5 required. "
                    "Keep all valid candidates — no upper cap."
                ),
                "items": {
                    "type": "object",
                    "properties": {
                        "task": {
                            "type": "string",
                            "description": "The task description shown to the worker.",
                        },
                        "generated": {
                            "type": "boolean",
                            "description": (
                                "True if invented from app metadata; "
                                "false if sourced from the candidate list."
                            ),
                        },
                    },
                    "required": ["task", "generated"],
                },
            },
            "flagged": {
                "type": "array",
                "description": "Candidates excluded from the selected list, kept for reference.",
                "items": {
                    "type": "object",
                    "properties": {
                        "task": {
                            "type": "string",
                            "description": "Original candidate task text.",
                        },
                        "reason": {
                            "type": "string",
                            "enum": ["paywall", "duplicate", "invalid", "non-english"],
                            "description": (
                                "paywall — requires purchasing a plan or transferring money; "
                                "duplicate — same UX journey as another kept task; "
                                "invalid — single tap only, requires private account data, "
                                "or otherwise unrealistic for a worker; "
                                "non-english — task text is not in English."
                            ),
                        },
                    },
                    "required": ["task", "reason"],
                },
            },
        },
        "required": ["selected", "flagged"],
    },
}

SYSTEM_PROMPT = """\
You are curating tasks for a mobile app usability study. \
Workers will screen-record themselves completing these tasks on a real iOS device. \
Each task must be a realistic action a typical user would do, covering at least 3 screens. \
Always write tasks in English, even if the app description is in another language."""

USER_PROMPT_TEMPLATE = """\
App: {name}
Category: {category}
Description (truncated to 2000 chars):
{description}

Candidate tasks scraped from the app (may be noisy):
{candidate_list}

---
INSTRUCTIONS

Today's date is May 2026. Use this when updating task dates.

STEP 1 — Classify each candidate:

  VALID     Keep (with minor edits if needed per rules below).
  PAYWALL   Flag: task requires buying a subscription or transferring real money
            (e.g. "subscribe to Pro for $4.99", "purchase the premium plan").
            Do NOT discard — move to flagged list with reason "paywall".
  DUPLICATE Flag: task covers the same UX journey as another candidate.
            Keep the clearest version as VALID; move the rest to flagged with
            reason "duplicate".
  INVALID   Flag: task is a single tap with no further screen interaction,
            requires private account data the worker won't have
            (e.g. "view MY past orders", "check MY December statement"),
            or is otherwise impossible for a stranger to complete.
            Move to flagged with reason "invalid".
  NON-ENG   Flag: task text is not in English (even if the app itself is
            non-English). Move to flagged with reason "non-english".

Rules for editing VALID tasks before adding to selected:
  • Keep each task under 75 characters — trim or reword if needed, preserving intent.
  • Old specific dates → update to a plausible recent date
    (e.g. "Jan 22, 2022" → "January 2026").
  • Holiday / deal references ("Black Friday", "this week's deal") → keep as-is.
  • Product / item searches → keep, but append "(or a similar item if unavailable)"
    if the named item could plausibly no longer exist.
  • Tasks containing fake placeholder names ("test user", "test post",
    "Sample Name") → rewrite with a realistic name or text
    (e.g. "Alex Johnson", "a coffee shop near downtown").
  • Tasks with placeholder credentials (e.g. "log in using testuser@gmail.com",
    "use password123") → rewrite to generic phrasing
    (e.g. "log in using an email account", "sign in with your credentials").
  • Login / sign-in tasks → VALID.
  • App settings tasks (notifications, theme, language, display) → VALID.

STEP 2 — Build the selected list.
  Put all VALID tasks in selected (generated=false).
  If multiple valid tasks cover different feature areas, keep all of them.
  There is NO upper limit — do not cut tasks just to reach exactly 5.

STEP 3 — Generate extras if needed.
  If fewer than 5 VALID tasks remain after Step 1, invent enough new tasks
  to reach exactly 5 in selected. Generated tasks must:
  • Be completable by any worker with no pre-existing account history.
  • Be timeless — no specific dates, no named sale events.
  • Use realistic names/text (not "test user", "test post").
  • Do not use placeholder credentials — use generic phrasing instead
    (e.g. "log in using an email account", not "log in using testuser@gmail.com").
  • NOT require payment, subscription, or money transfer.
  • Prefer practical flows: search, browse, filter, compare, share, save,
    configure settings (notifications, theme), account setup, login, favorites.
  • Only suggest tasks like "read the privacy policy" or "view terms of service"
    if no other realistic task can be found from the app description.
  • Keep each task under 75 characters — one clear, direct sentence.
  Mark all invented tasks generated=true.

Call submit_curated_tasks with the completed selected and flagged lists."""


# ---------------------------------------------------------------------------
# Core logic
# ---------------------------------------------------------------------------


def build_prompt(entry: dict) -> str:
    meta = entry["app"]["metadata"]
    name = meta.get("name", "Unknown App")
    category = entry["app"].get("category", {}).get("name", "Unknown")
    description = (meta.get("description") or "")[:2000]
    candidates = entry.get("candidateTasks", [])

    if candidates:
        candidate_list = "\n".join(f"  {i+1}. {t}" for i, t in enumerate(candidates))
    else:
        candidate_list = "  (none — generate all 5 from app description)"

    return USER_PROMPT_TEMPLATE.format(
        name=name,
        category=category,
        description=description,
        candidate_list=candidate_list,
    )


async def curate_entry(
    client: anthropic.AsyncAnthropic,
    entry: dict,
    semaphore: asyncio.Semaphore,
    rate_limiter: TokenBucket,
) -> dict | None:
    meta = entry["app"]["metadata"]
    name = meta.get("name", "Unknown App")

    # Acquire rate-limit token BEFORE the semaphore so we don't hold a
    # concurrency slot while waiting for the bucket to refill.
    await rate_limiter.acquire()

    async with semaphore:
        response = None
        for attempt in range(MAX_RETRIES):
            try:
                response = await client.messages.create(
                    model=MODEL,
                    max_tokens=2048,
                    system=SYSTEM_PROMPT,
                    messages=[{"role": "user", "content": build_prompt(entry)}],
                    tools=[TOOL_SCHEMA],
                    tool_choice={"type": "tool", "name": "submit_curated_tasks"},
                )
                break  # success
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
                # Retry on 5xx; give up on other client errors
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

    tool_use_block = next(
        (b for b in response.content if b.type == "tool_use"), None
    )
    if tool_use_block is None:
        print(f"\n[WARN] {name}: no tool call in response", file=sys.stderr)
        return None

    def _coerce_list(val: object) -> list:
        """Model occasionally returns a list field as a JSON-encoded string."""
        if isinstance(val, list):
            return val
        if isinstance(val, str):
            try:
                parsed = json.loads(val)
                if isinstance(parsed, list):
                    return parsed
            except json.JSONDecodeError:
                pass
        return []

    selected = _coerce_list(tool_use_block.input.get("selected", []))
    flagged = _coerce_list(tool_use_block.input.get("flagged", []))

    if len(selected) < 5:
        print(
            f"\n[WARN] {name}: only {len(selected)} selected tasks (expected ≥5)",
            file=sys.stderr,
        )

    return {
        "id": entry["id"],
        "appId": entry["appId"],
        "appName": name,
        "category": entry["app"].get("category", {}).get("name", ""),
        "os": entry["app"].get("os", "ios"),
        # Scoring metadata — kept for assign_tasks.py; not shown to workers.
        "meta": {
            "rating": meta.get("rating"),
            "reviews": meta.get("reviews"),
            "genre": meta.get("genre") or [],
            "url": meta.get("url"),
            "icon": meta.get("icon"),
        },
        "selected": selected,
        "flagged": flagged,
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


async def main(args: argparse.Namespace) -> None:
    input_path = Path(args.input)
    output_path = Path(args.output)

    with open(input_path) as f:
        data: list[dict] = json.load(f)

    already_done: set[str] = set()
    results: list[dict] = []
    if args.resume and output_path.exists():
        with open(output_path) as f:
            results = json.load(f)
        already_done = {r["id"] for r in results}
        print(f"Resuming: {len(already_done)} entries already processed.")

    filter_ids: set[str] = set()
    if args.app_ids:
        filter_ids = {a.strip() for a in args.app_ids.split(",") if a.strip()}
        data = [e for e in data if e.get("appId") in filter_ids]
        print(f"Filtering to {len(data)} apps matching --app-ids.")

    pending = [e for e in data if e["id"] not in already_done]
    print(f"Processing {len(pending)} entries (skipping {len(already_done)}).")

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        sys.exit("ANTHROPIC_API_KEY environment variable is not set.")

    client = anthropic.AsyncAnthropic(api_key=api_key, max_retries=0)  # retries handled manually
    semaphore = asyncio.Semaphore(args.concurrency)
    rate_limiter = TokenBucket(args.rpm)
    print(f"Rate limit: {args.rpm} RPM | Concurrency: {args.concurrency}")

    coros = [curate_entry(client, entry, semaphore, rate_limiter) for entry in pending]
    new_results = await tqdm_asyncio.gather(*coros, desc="Curating")

    for r in new_results:
        if r is not None:
            results.append(r)

    with open(output_path, "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    # Summary stats
    total_apps = len(results)
    total_selected = sum(len(r.get("selected", [])) for r in results)
    generated = sum(
        1 for r in results
        for t in r.get("selected", [])
        if isinstance(t, dict) and t.get("generated")
    )
    flagged_by_reason: dict[str, int] = {}
    for r in results:
        for f in r.get("flagged", []):
            if not isinstance(f, dict):
                continue
            reason = f.get("reason", "unknown")
            flagged_by_reason[reason] = flagged_by_reason.get(reason, 0) + 1

    print(f"\nDone. {total_apps} apps → {output_path}")
    print(f"  Selected tasks : {total_selected} total ({generated} generated)")
    print(f"  Flagged tasks  : {sum(flagged_by_reason.values())} total")
    for reason, count in sorted(flagged_by_reason.items()):
        print(f"    {reason}: {count}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input", default=str(INPUT_DEFAULT), help="Path to candidate JSON file."
    )
    parser.add_argument(
        "--output", default=str(OUTPUT_DEFAULT), help="Path for curated output JSON."
    )
    parser.add_argument(
        "--concurrency",
        type=int,
        default=MAX_CONCURRENCY,
        help="Max parallel in-flight API requests (default 10).",
    )
    parser.add_argument(
        "--rpm",
        type=int,
        default=DEFAULT_RPM,
        help="Max requests per minute sent to the API (default 40; Haiku tier-1 limit is 50).",
    )
    parser.add_argument(
        "--resume",
        action="store_true",
        help="Skip entries already present in the output file.",
    )
    parser.add_argument(
        "--app-ids",
        default="",
        help="Comma-separated list of appIds to process (e.g. '123,456,789'). Processes all if omitted.",
    )
    args = parser.parse_args()
    asyncio.run(main(args))
