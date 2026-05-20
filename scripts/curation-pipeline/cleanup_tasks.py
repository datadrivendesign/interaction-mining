"""
cleanup_tasks.py — Audit and fix quality issues in curated-tasks.json.

Checks for:
  1. Placeholder emails (e.g. testuser@gmail.com) — fixed locally via regex.
  2. Tasks exceeding 100 characters — reworded via Claude API (target: 75 chars).
     Tasks between 76–99 characters are accepted as-is.

Fixes are applied in order: email fix first, then length check on the result,
so a task that was too long only because of the email address won't burn an API call.

Usage:
    python3 cleanup_tasks.py                  # full audit, dry run
    python3 cleanup_tasks.py --email-only     # show only email issues
    python3 cleanup_tasks.py --length-only    # show only length issues
    python3 cleanup_tasks.py --apply          # fix emails + reword long tasks via API

Requires (for --apply with length fixes):
    pip install anthropic tqdm
"""

import argparse
import asyncio
import json
import re
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path

INPUT_DEFAULT = Path(__file__).parent / "curated-tasks.json"
MAX_LEN = 100
MODEL = "claude-haiku-4-5-20251001"
MAX_CONCURRENCY = 10
DEFAULT_RPM = 40
MAX_RETRIES = 3
RETRY_BASE_DELAY = 5.0

EMAIL_RE = re.compile(r'["\']?[\w.+-]+@[\w-]+\.[a-z]{2,}["\']?', re.IGNORECASE)


# ---------------------------------------------------------------------------
# Issue types
# ---------------------------------------------------------------------------


@dataclass
class TaskIssue:
    app_name: str
    app_id: str
    task: dict                    # reference to the dict in `data` — mutated in place on apply
    original: str
    email_fix: str | None = None  # proposed local fix (or None if no email issue)
    needs_reword: bool = False    # True if still >100 chars after email fix


# ---------------------------------------------------------------------------
# Email fix logic
# ---------------------------------------------------------------------------


def email_replacement(text: str, match: re.Match) -> str:
    before = text[: match.start()].rstrip().lower()
    if re.search(r'\b(send|forward|deliver|submit|notify)\b', before) and before.endswith(("to", "to ")):
        return "a valid email address"
    if re.search(r'\binvite\b', before):
        return "a colleague's email address"
    if re.search(r'\b(add|enter|type|fill|input)\b', before):
        return "an email address"
    if re.search(r'\b(sign up|register|subscribe|create an account)\b', before):
        return "an email address"
    return "an email account"


def apply_email_fix(text: str) -> str:
    def replacer(m: re.Match) -> str:
        return email_replacement(text, m)
    return EMAIL_RE.sub(replacer, text)


# ---------------------------------------------------------------------------
# Audit
# ---------------------------------------------------------------------------


def audit(data: list[dict]) -> list[TaskIssue]:
    issues: list[TaskIssue] = []
    for entry in data:
        for task in entry.get("selected", []):
            original = task["task"]
            has_email = bool(EMAIL_RE.search(original))
            after_email = apply_email_fix(original) if has_email else original
            too_long = len(after_email) > MAX_LEN

            if has_email or too_long:
                issues.append(TaskIssue(
                    app_name=entry.get("appName", "?"),
                    app_id=entry.get("appId", ""),
                    task=task,
                    original=original,
                    email_fix=after_email if has_email else None,
                    needs_reword=too_long,
                ))
    return issues


# ---------------------------------------------------------------------------
# Rate limiter (reused from curate_tasks.py)
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
            self._tokens = min(self._max, self._tokens + (now - self._last_refill) * self._rate)
            self._last_refill = now
            if self._tokens >= 1.0:
                self._tokens -= 1.0
            else:
                wait = (1.0 - self._tokens) / self._rate
                self._tokens = 0.0
                await asyncio.sleep(wait)


# ---------------------------------------------------------------------------
# API rewording
# ---------------------------------------------------------------------------


async def reword(
    client,
    issue: TaskIssue,
    semaphore: asyncio.Semaphore,
    rate_limiter: TokenBucket,
) -> str | None:
    """Return the reworded task string, or None on failure."""
    text = issue.email_fix if issue.email_fix is not None else issue.original

    await rate_limiter.acquire()
    async with semaphore:
        for attempt in range(MAX_RETRIES):
            try:
                response = await client.messages.create(
                    model=MODEL,
                    max_tokens=64,
                    system=(
                        "You rewrite mobile app task descriptions to be concise. "
                        "CRITICAL: Your response MUST be 75 characters or fewer — this is a hard limit. "
                        "Return only the rewritten task — no explanation, no quotes."
                    ),
                    messages=[{
                        "role": "user",
                        "content": (
                            "Rewrite in 75 characters or fewer (hard limit), "
                            f"preserving the intent:\n{text}"
                        ),
                    }],
                )
                result = response.content[0].text.strip().strip('"').strip("'")
                if len(result) > MAX_LEN:
                    # Trim to last complete word within MAX_LEN rather than slicing mid-word
                    trimmed = result[:MAX_LEN].rsplit(' ', 1)[0].rstrip()
                    result = trimmed if trimmed else result[:MAX_LEN]
                return result
            except Exception as exc:
                import anthropic
                if isinstance(exc, anthropic.RateLimitError) or (
                    isinstance(exc, anthropic.APIStatusError) and exc.status_code >= 500
                ):
                    if attempt < MAX_RETRIES - 1:
                        await asyncio.sleep(RETRY_BASE_DELAY * (2 ** attempt))
                        continue
                print(f"\n[ERROR] reword failed for '{text[:40]}…': {exc}", file=sys.stderr)
                return None
    return None


# ---------------------------------------------------------------------------
# Display helpers
# ---------------------------------------------------------------------------

RESET  = "\033[0m"
RED    = "\033[31m"
YELLOW = "\033[33m"
GREEN  = "\033[32m"
BOLD   = "\033[1m"
DIM    = "\033[2m"


def fmt_len(n: int) -> str:
    return f"{RED}{n} chars{RESET}" if n > MAX_LEN else f"{GREEN}{n} chars{RESET}"


def print_issue(issue: TaskIssue, reworded: str | None = None) -> None:
    tags = []
    if issue.email_fix is not None:
        tags.append(f"{YELLOW}email{RESET}")
    if issue.needs_reword:
        tags.append(f"{RED}too long{RESET}")
    tag_str = " + ".join(tags)

    print(f"  {BOLD}[{issue.app_name}]{RESET}  {tag_str}")
    print(f"    {DIM}ORIGINAL{RESET} ({fmt_len(len(issue.original))}): {issue.original}")

    if issue.email_fix is not None and not issue.needs_reword:
        print(f"    {GREEN}FIX{RESET}      ({fmt_len(len(issue.email_fix))}): {issue.email_fix}")
    elif reworded is not None:
        print(f"    {GREEN}REWORDED{RESET} ({fmt_len(len(reworded))}): {reworded}")
    elif issue.needs_reword:
        after = issue.email_fix or issue.original
        print(f"    {DIM}AFTER EMAIL FIX{RESET} ({fmt_len(len(after))}): {after}")
        print(f"    {YELLOW}→ will be reworded via API{RESET}")
    print()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


async def main(args: argparse.Namespace) -> None:
    path = Path(args.input)
    with open(path) as f:
        data = json.load(f)

    issues = audit(data)

    email_issues  = [i for i in issues if i.email_fix is not None and not i.needs_reword]
    length_issues = [i for i in issues if i.needs_reword]
    both          = [i for i in length_issues if i.email_fix is not None]

    print(f"\n{BOLD}AUDIT SUMMARY{RESET}")
    print(f"  Placeholder emails only : {len(email_issues)} tasks")
    print(f"  Exceeds {MAX_LEN} chars (after email fix) : {len(length_issues)} tasks  "
          f"({len(both)} also have email issues)")
    print(f"  Total flagged           : {len(issues)} tasks across "
          f"{len({i.app_id for i in issues})} apps\n")

    if not issues:
        print("Nothing to fix.")
        return

    # Filter display
    display = issues
    if args.email_only:
        display = [i for i in issues if i.email_fix is not None]
    elif args.length_only:
        display = [i for i in issues if i.needs_reword]

    if not args.apply:
        print(f"{BOLD}FLAGGED TASKS{RESET} (dry run — pass --apply to fix)\n")
        for issue in display:
            print_issue(issue)
        print(f"─── {len(display)} issues shown. Pass --apply to fix. ───")
        return

    # ── Apply ──────────────────────────────────────────────────────────────

    # Step 1: apply email fixes locally
    for issue in issues:
        if issue.email_fix is not None:
            issue.task["task"] = issue.email_fix
    print(f"Email fixes applied locally: {len(email_issues) + len(both)} tasks")

    # Step 2: reword tasks that are still too long
    if length_issues:
        try:
            import anthropic
        except ImportError:
            sys.exit("Install anthropic to reword long tasks: pip install anthropic")

        api_key = __import__("os").environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            sys.exit("ANTHROPIC_API_KEY not set.")

        client = anthropic.AsyncAnthropic(api_key=api_key, max_retries=0)
        semaphore = asyncio.Semaphore(MAX_CONCURRENCY)
        rate_limiter = TokenBucket(DEFAULT_RPM)

        print(f"Rewording {len(length_issues)} long tasks via API…")

        try:
            from tqdm.asyncio import tqdm_asyncio
            gather = tqdm_asyncio.gather
        except ImportError:
            gather = asyncio.gather

        reworded_texts = await gather(
            *[reword(client, issue, semaphore, rate_limiter) for issue in length_issues]
        )

        applied = 0
        failed = 0
        for issue, text in zip(length_issues, reworded_texts):
            if text:
                print_issue(issue, reworded=text)
                issue.task["task"] = text
                applied += 1
            else:
                print_issue(issue)
                print(f"    {RED}[FAILED] keeping current text{RESET}\n")
                failed += 1

        print(f"Reworded: {applied} tasks  |  Failed: {failed} tasks")

    with open(path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"\nSaved → {path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", default=str(INPUT_DEFAULT),
                        help="Path to curated-tasks JSON.")
    parser.add_argument("--apply", action="store_true",
                        help="Write fixes to the file (default: dry run).")
    parser.add_argument("--email-only", action="store_true",
                        help="Show only placeholder email issues.")
    parser.add_argument("--length-only", action="store_true",
                        help="Show only tasks exceeding 100 characters.")
    args = parser.parse_args()
    asyncio.run(main(args))
