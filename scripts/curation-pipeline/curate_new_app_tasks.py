"""
curate_new_app_tasks.py — Curate Haiku-generated tasks using Claude Sonnet.

Reads generated-tasks.json (output of generate_new_app_tasks.py) and for each app:
  - Flags the whole app as hardware-dependent if it primarily requires a physical
    device the worker won't own (IoT, smart home, wearables, etc.).
  - Classifies each task as valid, paywall, duplicate, invalid, or non-english.
  - Rewrites valid tasks to meet style rules (≤110 chars, realistic names, etc.).
  - Generates extras if fewer than 5 valid tasks remain.

Hardware-dependent apps have selected=[] in the output — they are kept in the file
for manual inspection but will be skipped by import_new_app_candidates.py.

Usage:
    python3 curate_new_app_tasks.py [--input FILE] [--output FILE]
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

MODEL = "claude-sonnet-4-6"
MAX_CONCURRENCY = 5    # Sonnet has a lower RPM limit than Haiku
DEFAULT_RPM = 40
MAX_RETRIES = 4
RETRY_BASE_DELAY = 10.0
INPUT_DEFAULT = Path(__file__).parent / "generated-tasks.json"
OUTPUT_DEFAULT = Path(__file__).parent / "curated-tasks-new.json"

# ---------------------------------------------------------------------------
# Rate limiter
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
    "name": "submit_curated_tasks",
    "description": "Submit the curated task lists for this app.",
    "input_schema": {
        "type": "object",
        "properties": {
            "requires_hardware": {
                "type": "boolean",
                "description": (
                    "True if the app primarily requires physical hardware the worker "
                    "won't own: IoT devices, smart home hubs, wearables (smartwatches, "
                    "fitness trackers), vehicle OBD readers, connected medical devices, etc. "
                    "False if the app is self-contained on a phone or works with free accounts."
                ),
            },
            "hardware_reason": {
                "type": "string",
                "description": (
                    "If requires_hardware is true, one sentence explaining what hardware "
                    "is needed (e.g. 'Requires a Philips Hue smart bulb to function'). "
                    "Empty string otherwise."
                ),
            },
            "selected": {
                "type": "array",
                "minItems": 0,
                "description": (
                    "Tasks to show workers. At least 5 required for non-hardware apps. "
                    "Must be empty ([]) if requires_hardware is true."
                ),
                "items": {
                    "type": "object",
                    "properties": {
                        "task": {"type": "string"},
                        "generated": {
                            "type": "boolean",
                            "description": (
                                "True if invented to reach the minimum of 5; "
                                "false if sourced from the candidate list."
                            ),
                        },
                    },
                    "required": ["task", "generated"],
                },
            },
            "flagged": {
                "type": "array",
                "description": "Candidates excluded from selected, kept for reference.",
                "items": {
                    "type": "object",
                    "properties": {
                        "task": {"type": "string"},
                        "reason": {
                            "type": "string",
                            "enum": ["paywall", "duplicate", "invalid", "non-english", "requires_hardware"],
                        },
                    },
                    "required": ["task", "reason"],
                },
            },
        },
        "required": ["requires_hardware", "hardware_reason", "selected", "flagged"],
    },
}

SYSTEM_PROMPT = """\
You are curating tasks for a mobile app usability study. \
Workers will screen-record themselves completing these tasks on a real iOS device. \
Workers have a phone and internet access. They may create free accounts during tasks. \
They do not own smart home devices, wearables, vehicle readers, or other physical hardware. \
Always write tasks in English, even if the app description is in another language."""

USER_PROMPT_TEMPLATE = """\
App: {name}
Category: {category}
Description (truncated to 2000 chars):
{description}

Candidate tasks (AI-generated from app description and user reviews):
{candidate_list}

---
INSTRUCTIONS

Today's date is May 2026. Use this when updating task dates.

STEP 0 — Hardware check.
  Does this app PRIMARILY require physical hardware the worker won't own?
  Examples: smart bulbs, thermostats, locks, wearables, fitness trackers, OBD readers,
  connected medical devices, smart TVs (as the primary interface), drone controllers.
  NOT hardware-dependent: apps that optionally sync with a wearable but work standalone,
  apps that work with a phone camera, apps that require only a free account.
  If requires_hardware=true: set selected=[], move all candidates to flagged with
  reason "requires_hardware", fill hardware_reason, and stop — skip Steps 1–3.

STEP 1 — Classify each candidate task:

  VALID     Keep (with minor edits per rules below).
  PAYWALL   Flag: task requires buying a subscription or transferring real money.
            Move to flagged with reason "paywall".
  DUPLICATE Flag: task covers the same UX journey as another candidate.
            Keep the clearest version as VALID; flag the rest as "duplicate".
  INVALID   Flag: task requires private data the worker can't plausibly create
            (e.g. "view MY past orders"), is a single tap with no screen journey,
            or is otherwise impossible for a stranger to complete.
            Move to flagged with reason "invalid".
  NON-ENG   Flag: task text is not in English. Move to flagged with reason "non-english".

Rules for editing VALID tasks before adding to selected:
  • Keep each task under 110 characters — trim or reword if needed, preserving intent.
  • Workers may create a free account — account creation and login tasks are VALID.
  • Old specific dates → update to a plausible recent date (e.g. "January 2026").
  • Product / item searches → keep, append "(or similar if unavailable)" only if
    the named item could plausibly no longer exist.
  • Placeholder names ("test user", "test post", "Sample Name") → realistic name
    (e.g. "Alex Johnson", "a coffee shop near downtown").
  • Placeholder credentials ("testuser@gmail.com", "password123") → generic phrasing
    (e.g. "create a free account", "sign in with your email").
  • Holiday / sale references ("Black Friday", "this week's deal") → keep as-is.

STEP 2 — Build the selected list.
  Put all VALID tasks in selected (generated=false).
  There is NO upper limit — keep all valid tasks if they cover different feature areas.

STEP 3 — Generate extras if needed.
  If fewer than 5 VALID tasks remain, invent enough to reach exactly 5 in selected.
  Generated tasks must:
  • Be completable with just a phone and a free account.
  • Be timeless — no specific dates, no named sale events.
  • Use realistic names/text (not "test user", "test post").
  • Use generic credential phrasing (e.g. "create a free account").
  • NOT require payment, subscription, or money transfer.
  • Prefer: account creation, search, browse, filter, compare, share, save,
    configure settings (notifications, theme, language), login, favorites.
  • Keep each task under 110 characters.
  Mark all invented tasks generated=true.

Call submit_curated_tasks with the completed selected, flagged, requires_hardware,
and hardware_reason fields."""


def build_prompt(entry: dict) -> str:
    name = entry.get("appName", "Unknown App")
    category = entry.get("primaryGenre", "Unknown")
    description = (entry.get("description") or "")[:2000]
    candidates = entry.get("candidateTasks", [])

    if candidates:
        candidate_list = "\n".join(f"  {i + 1}. {t}" for i, t in enumerate(candidates))
    else:
        candidate_list = "  (none — generate all 5 from app description)"

    return USER_PROMPT_TEMPLATE.format(
        name=name,
        category=category,
        description=description,
        candidate_list=candidate_list,
    )


# ---------------------------------------------------------------------------
# Core curation logic
# ---------------------------------------------------------------------------


async def curate_entry(
    client: anthropic.AsyncAnthropic,
    entry: dict,
    semaphore: asyncio.Semaphore,
    rate_limiter: TokenBucket,
) -> dict | None:
    name = entry.get("appName", "Unknown App")

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

    def _coerce_list(val: object) -> list:
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

    requires_hardware = bool(tool_block.input.get("requires_hardware", False))
    hardware_reason   = tool_block.input.get("hardware_reason", "") or ""
    selected          = _coerce_list(tool_block.input.get("selected", []))
    flagged           = _coerce_list(tool_block.input.get("flagged", []))

    if requires_hardware:
        print(f"\n[SKIP] {name}: hardware-dependent — {hardware_reason}", file=sys.stderr)
    elif len(selected) < 5:
        print(
            f"\n[WARN] {name}: only {len(selected)} selected tasks (expected ≥5)",
            file=sys.stderr,
        )

    return {
        "trackId":          entry["trackId"],
        "bundleId":         entry["bundleId"],
        "appName":          name,
        "company":          entry.get("company", ""),
        "description":      entry.get("description", ""),
        "icon":             entry.get("icon", ""),
        "cover":            entry.get("cover", ""),
        "primaryGenre":     entry.get("primaryGenre", ""),
        "genre":            entry.get("genre", []),
        "url":              entry.get("url"),
        "os":               "ios",
        "score":            entry.get("score"),
        "requiresHardware": requires_hardware,
        "hardwareReason":   hardware_reason,
        "meta":             entry.get("meta", {}),
        "selected":         selected,
        "flagged":          flagged,
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


async def main(args: argparse.Namespace) -> None:
    input_path = Path(args.input)
    output_path = Path(args.output)

    with open(input_path) as f:
        data: list[dict] = json.load(f)

    print(f"Loaded {len(data)} entries from {input_path}.")

    already_done: set[str] = set()
    results: list[dict] = []
    if args.resume and output_path.exists():
        with open(output_path) as f:
            results = json.load(f)
        already_done = {r["trackId"] for r in results}
        print(f"Resuming: {len(already_done)} entries already processed.")

    pending = [e for e in data if e["trackId"] not in already_done]
    print(f"Processing {len(pending)} entries (skipping {len(already_done)}).")

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

    coros = [curate_entry(client, entry, semaphore, rate_limiter) for entry in pending]
    new_results = await tqdm_asyncio.gather(*coros, desc="Curating")

    for r in new_results:
        if r is not None:
            results.append(r)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    # Summary stats
    hardware_count  = sum(1 for r in results if r.get("requiresHardware"))
    eligible        = [r for r in results if not r.get("requiresHardware")]
    total_selected  = sum(len(r.get("selected", [])) for r in eligible)
    generated_count = sum(
        1 for r in eligible
        for t in r.get("selected", [])
        if isinstance(t, dict) and t.get("generated")
    )
    flagged_by_reason: dict[str, int] = {}
    for r in results:
        for f in r.get("flagged", []):
            if isinstance(f, dict):
                reason = f.get("reason", "unknown")
                flagged_by_reason[reason] = flagged_by_reason.get(reason, 0) + 1

    print(f"\nDone. {len(results)} apps → {output_path}")
    print(f"  Hardware-dependent (skipped): {hardware_count}")
    print(f"  Eligible apps:                {len(eligible)}")
    print(f"  Selected tasks:               {total_selected} total ({generated_count} generated)")
    print(f"  Flagged tasks:                {sum(flagged_by_reason.values())} total")
    for reason, count in sorted(flagged_by_reason.items()):
        print(f"    {reason}: {count}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input", default=str(INPUT_DEFAULT),
        help="Path to generated-tasks.json (output of generate_new_app_tasks.py).",
    )
    parser.add_argument(
        "--output", default=str(OUTPUT_DEFAULT),
        help="Output JSON path (default: curated-tasks-new.json).",
    )
    parser.add_argument(
        "--concurrency", type=int, default=MAX_CONCURRENCY,
        help=f"Max parallel API requests (default {MAX_CONCURRENCY}).",
    )
    parser.add_argument(
        "--rpm", type=int, default=DEFAULT_RPM,
        help=f"Max requests per minute (default {DEFAULT_RPM}).",
    )
    parser.add_argument(
        "--resume", action="store_true",
        help="Skip entries already present in the output file.",
    )
    args = parser.parse_args()
    asyncio.run(main(args))
