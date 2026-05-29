"""
assign_tasks.py — Rank curated apps and distribute top-N lists to workers.

Reads curated-tasks.json (output of curate_tasks.py), scores each app on
learnability and quality, then assigns apps to workers via round-robin so
every worker gets a similarly-quality set rather than one worker getting
all the best apps.

Usage:
    python3 assign_tasks.py [--input FILE] [--output-dir DIR]
                            [--workers N] [--apps-per-worker N]
                            [--min-rating F] [--min-reviews N]

Outputs (in --output-dir):
    ranked.json          — all apps sorted by score (for inspection)
    worker-01.json ...   — one file per worker, each with their app list
    summary.json         — worker → app name mapping at a glance
"""

import argparse
import json
import math
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

INPUT_DEFAULT   = Path(__file__).parent / "curated-tasks.json"
OUTPUT_DIR_DEFAULT = Path(__file__).parent / "worker-assignments"
EXCLUDE_DEFAULT = Path(__file__).parent / "ios-apps-with-captures-or-traces.json"

DEFAULT_WORKERS = 10
DEFAULT_APPS_PER_WORKER = 20
DEFAULT_MIN_RATING = 3.8
DEFAULT_MIN_REVIEWS = 500   # filter out very obscure apps

# Categories that are easy for newly onboarded workers: familiar UX patterns,
# no professional credentials needed, free to browse without an account.
EASY_GENRES = {
    "Lifestyle", "Entertainment", "Shopping", "Food & Drink", "Travel",
    "Social Networking", "Sports", "Navigation", "Health & Fitness",
    "Photo & Video", "Music", "Weather", "News", "Reference",
    "Magazines & Newspapers", "Utilities", "Education",
}

# Categories that slow workers down: paywalls, professional login, niche UX.
HARD_GENRES = {"Finance", "Business", "Medical", "Productivity"}


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------


def score(entry: dict) -> float:
    """
    Composite 0-1 score weighting quality signals relevant to worker ease:

      rating_score    (0.30) — higher-rated apps have more polished UX
      review_score    (0.20) — log-scale review count; proxy for mainstream appeal
      genre_score     (0.20) — bonus for easy categories, penalty for hard ones
      source_score    (0.20) — fraction of tasks that came from real scraped data
      paywall_penalty (0.10) — deduct for each flagged paywall task
    """
    meta = entry.get("meta", {})
    selected = entry.get("selected", [])
    flagged = entry.get("flagged", [])

    # --- Rating (0-1) ---
    raw_rating = meta.get("rating") or 0.0
    rating_score = max(0.0, min(raw_rating / 5.0, 1.0))

    # --- Review count log-normalised to 0-1 using 1M as ceiling ---
    raw_reviews = meta.get("reviews") or 0
    if raw_reviews > 0:
        review_score = min(math.log10(raw_reviews) / math.log10(1_000_000), 1.0)
    else:
        review_score = 0.0

    # --- Genre: +1 if any genre is easy, -0.5 if any is hard, else 0 ---
    genres = set(meta.get("genre") or [])
    if genres & EASY_GENRES:
        genre_score = 1.0
    elif genres & HARD_GENRES:
        genre_score = 0.25
    else:
        genre_score = 0.5  # unknown genre: neutral

    # --- Source tasks: fraction that are NOT generated ---
    if selected:
        source_score = sum(1 for t in selected if not t.get("generated")) / len(selected)
    else:
        source_score = 0.0

    # --- Paywall penalty: -0.2 per paywall flag, floored at 0 ---
    paywall_count = sum(1 for f in flagged if f.get("reason") == "paywall")
    paywall_penalty = min(paywall_count * 0.2, 1.0)

    total = (
        0.30 * rating_score
        + 0.20 * review_score
        + 0.20 * genre_score
        + 0.20 * source_score
        - 0.10 * paywall_penalty
    )
    return round(max(0.0, total), 4)


def passes_hard_filters(entry: dict, min_rating: float, min_reviews: int) -> bool:
    """Drop apps that will reliably fail workers regardless of score."""
    meta = entry.get("meta", {})
    selected = entry.get("selected", [])

    # Must have at least 5 selected tasks
    if len(selected) < 5:
        return False

    # Rating floor (skip if no rating data — keep it, can't penalise unknown)
    raw_rating = meta.get("rating")
    if raw_rating is not None and raw_rating > 0 and raw_rating < min_rating:
        return False

    # Review floor (skip if no review data — keep it)
    raw_reviews = meta.get("reviews")
    if raw_reviews is not None and raw_reviews > 0 and raw_reviews < min_reviews:
        return False

    return True


# ---------------------------------------------------------------------------
# Assignment
# ---------------------------------------------------------------------------


def round_robin_assign(ranked: list[dict], n_workers: int, apps_per_worker: int) -> list[list[dict]]:
    """
    Distribute apps to workers via round-robin so each worker gets an
    equally-quality spread rather than worker-1 getting all top apps.

    Worker i gets: ranked[i], ranked[i + n_workers], ranked[i + 2*n_workers], ...
    """
    needed = n_workers * apps_per_worker
    if len(ranked) < needed:
        print(
            f"[WARN] Only {len(ranked)} apps pass filters — "
            f"needed {needed} for {n_workers} workers × {apps_per_worker} apps. "
            f"Some workers will receive fewer apps.",
            file=sys.stderr,
        )

    pool = ranked[:needed]  # take only what we need
    workers: list[list[dict]] = [[] for _ in range(n_workers)]
    for i, app in enumerate(pool):
        workers[i % n_workers].append(app)
    return workers


# ---------------------------------------------------------------------------
# Output helpers
# ---------------------------------------------------------------------------


def app_to_worker_record(entry: dict) -> dict:
    """Subset of fields shown in each worker's assignment file."""
    return {
        "appName": entry["appName"],
        "category": entry["category"],
        "appStoreUrl": entry.get("meta", {}).get("url"),
        "icon": entry.get("meta", {}).get("icon"),
        "score": entry.get("score"),
        "tasks": entry["selected"],
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main(args: argparse.Namespace) -> None:
    input_path = Path(args.input)
    output_dir = Path(args.output_dir)

    with open(input_path) as f:
        data: list[dict] = json.load(f)

    print(f"Loaded {len(data)} curated apps from {input_path}.")

    # Exclude apps that already have captures or traces
    exclude_ids: set[str] = set()
    if args.exclude:
        exclude_path = Path(args.exclude)
        if exclude_path.exists():
            with open(exclude_path) as f:
                exclude_ids = {e["appId"] for e in json.load(f) if "appId" in e}
            before = len(data)
            data = [e for e in data if e.get("appId") not in exclude_ids]
            print(f"Excluded {before - len(data)} apps already in captures/traces → {len(data)} remaining.")
        else:
            print(f"[WARN] Exclude file not found: {exclude_path}", file=sys.stderr)

    # Score every app
    for entry in data:
        entry["score"] = score(entry)

    # Hard-filter
    filtered = [
        e for e in data
        if passes_hard_filters(e, args.min_rating, args.min_reviews)
    ]
    dropped = len(data) - len(filtered)
    print(f"Hard-filter removed {dropped} apps → {len(filtered)} candidates.")

    # Sort by score descending
    ranked = sorted(filtered, key=lambda e: e["score"], reverse=True)

    # Write ranked.json for inspection
    output_dir.mkdir(parents=True, exist_ok=True)
    ranked_path = output_dir / "ranked.json"
    with open(ranked_path, "w") as f:
        json.dump(
            [
                {
                    "rank": i + 1,
                    "appName": e["appName"],
                    "category": e["category"],
                    "score": e["score"],
                    "rating": e.get("meta", {}).get("rating"),
                    "reviews": e.get("meta", {}).get("reviews"),
                    "genre": e.get("meta", {}).get("genre"),
                    "selectedCount": len(e["selected"]),
                    "generatedCount": sum(1 for t in e["selected"] if t.get("generated")),
                    "paywallCount": sum(1 for t in e.get("flagged", []) if t.get("reason") == "paywall"),
                    "appStoreUrl": e.get("meta", {}).get("url"),
                }
                for i, e in enumerate(ranked)
            ],
            f,
            indent=2,
            ensure_ascii=False,
        )
    print(f"Ranked list written → {ranked_path}")

    # Assign to workers
    worker_lists = round_robin_assign(ranked, args.workers, args.apps_per_worker)

    summary = {}
    for idx, worker_apps in enumerate(worker_lists, start=1):
        worker_id = f"worker-{idx:02d}"
        worker_record = {
            "workerId": worker_id,
            "appCount": len(worker_apps),
            "apps": [app_to_worker_record(e) for e in worker_apps],
        }
        worker_path = output_dir / f"{worker_id}.json"
        with open(worker_path, "w") as f:
            json.dump(worker_record, f, indent=2, ensure_ascii=False)
        summary[worker_id] = [e["appName"] for e in worker_apps]
        print(f"  {worker_id}: {len(worker_apps)} apps → {worker_path.name}")

    summary_path = output_dir / "summary.json"
    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    print(f"\nSummary written → {summary_path}")
    print(f"Done. {args.workers} workers × up to {args.apps_per_worker} apps assigned.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input",
        default=str(INPUT_DEFAULT),
        help="Path to curated-tasks.json (output of curate_tasks.py).",
    )
    parser.add_argument(
        "--output-dir",
        default=str(OUTPUT_DIR_DEFAULT),
        help="Directory to write worker JSON files (created if absent).",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=DEFAULT_WORKERS,
        help=f"Number of workers (default {DEFAULT_WORKERS}).",
    )
    parser.add_argument(
        "--apps-per-worker",
        type=int,
        default=DEFAULT_APPS_PER_WORKER,
        help=f"Apps assigned per worker (default {DEFAULT_APPS_PER_WORKER}).",
    )
    parser.add_argument(
        "--min-rating",
        type=float,
        default=DEFAULT_MIN_RATING,
        help=f"Minimum App Store rating to include (default {DEFAULT_MIN_RATING}).",
    )
    parser.add_argument(
        "--min-reviews",
        type=int,
        default=DEFAULT_MIN_REVIEWS,
        help=f"Minimum review count to include (default {DEFAULT_MIN_REVIEWS}).",
    )
    parser.add_argument(
        "--exclude",
        default=str(EXCLUDE_DEFAULT),
        help="JSON file of apps that already have captures/traces and should be excluded.",
    )
    args = parser.parse_args()
    main(args)
