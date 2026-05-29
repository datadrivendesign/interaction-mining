"""
scrape_appstore_apps.py — Fetch top iOS apps from iTunes RSS + Lookup APIs.

Pipeline:
  1. Fetch top-200 free apps per genre from Apple's iTunes RSS feeds.
  2. Deduplicate across genres by iTunes trackId.
  3. Batch-fetch full metadata (200 IDs/request) via the iTunes Lookup API.
  4. Fetch up to REVIEWS_PER_APP recent reviews per app from the Customer Reviews feed.
  5. Filter out games and apps already in your MongoDB apps collection.
  6. Score by rating × log(reviews) and keep the top --limit apps.

Usage:
    python3 scrape_appstore_apps.py [--limit N] [--output FILE] [--db-url URL]

Requires:
    pip install pymongo python-dotenv tqdm requests
"""

import argparse
import json
import math
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

import requests
from dotenv import load_dotenv
from pymongo import MongoClient
from tqdm import tqdm

load_dotenv()

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

OUTPUT_DEFAULT = Path(__file__).parent / "new-apps.json"
DEFAULT_LIMIT = 1500
REVIEWS_PER_APP = 5
LOOKUP_BATCH_SIZE = 200
REQUEST_DELAY = 0.5   # seconds between Apple API requests

# Genre IDs sourced from iTunes — 6014 (Games) is intentionally excluded.
GENRES: dict[int, str] = {
    6000: "Business",
    6001: "Weather",
    6002: "Utilities",
    6003: "Travel",
    6004: "Sports",
    6005: "Social Networking",
    6006: "Reference",
    6007: "Productivity",
    6008: "Photo & Video",
    6009: "News",
    6010: "Navigation",
    6011: "Music",
    6012: "Lifestyle",
    6013: "Health & Fitness",
    6015: "Finance",
    6016: "Entertainment",
    6017: "Education",
    6018: "Books",
    6019: "Food & Drink",
    6020: "Medical",
}

# Belt-and-suspenders: also exclude by name in case a sub-genre slips through.
GAME_GENRE_NAMES = {"Games", "Game"}

# ---------------------------------------------------------------------------
# iTunes API helpers
# ---------------------------------------------------------------------------

_SESSION = requests.Session()
_SESSION.headers.update({"User-Agent": "interaction-mining-scraper/1.0"})


def _get_json(url: str, retries: int = 6) -> dict | None:
    for attempt in range(retries):
        try:
            time.sleep(REQUEST_DELAY)
            r = _SESSION.get(url, timeout=15)

            if r.status_code == 429:
                # Respect Retry-After if Apple sends it, otherwise back off hard.
                retry_after = r.headers.get("Retry-After")
                wait = float(retry_after) if retry_after else 60.0 * (2 ** attempt)
                wait = min(wait, 600.0)  # cap at 10 minutes
                print(
                    f"\n[RATE LIMIT] 429 on attempt {attempt + 1}/{retries}. "
                    f"Waiting {wait:.0f}s before retry…",
                    file=sys.stderr,
                )
                if attempt == retries - 1:
                    print(f"\n[WARN] Gave up after {retries} rate-limit retries: {url}", file=sys.stderr)
                    return None
                time.sleep(wait)
                continue

            r.raise_for_status()
            return r.json()

        except requests.exceptions.RequestException as exc:
            if attempt == retries - 1:
                print(f"\n[WARN] Failed after {retries} attempts: {url} — {exc}", file=sys.stderr)
                return None
            wait = 2.0 ** attempt  # 1s, 2s, 4s, 8s, 16s for transient errors
            time.sleep(wait)

    return None


def fetch_top_ids_for_genre(genre_id: int) -> list[str]:
    """Return up to 200 trackId strings from the iTunes top-free RSS feed."""
    url = (
        f"https://itunes.apple.com/us/rss/topfreeapplications"
        f"/limit=200/genre={genre_id}/json"
    )
    data = _get_json(url)
    if not data:
        return []
    entries = data.get("feed", {}).get("entry", [])
    return [
        e["id"]["attributes"]["im:id"]
        for e in entries
        if e.get("id", {}).get("attributes", {}).get("im:id")
    ]


def fetch_metadata_batch(ids: list[str]) -> list[dict]:
    """Return full app records for up to LOOKUP_BATCH_SIZE iTunes IDs."""
    url = f"https://itunes.apple.com/lookup?id={','.join(ids)}&country=us"
    data = _get_json(url)
    if not data:
        return []
    return [r for r in data.get("results", []) if r.get("wrapperType") == "software"]


def fetch_reviews(app_id: str) -> list[dict]:
    """Return up to REVIEWS_PER_APP recent reviews (title, text, rating)."""
    url = (
        f"https://itunes.apple.com/us/rss/customerreviews"
        f"/id={app_id}/sortBy=mostRecent/json"
    )
    data = _get_json(url)
    if not data:
        return []
    entries = data.get("feed", {}).get("entry", [])
    reviews = []
    for entry in entries:
        if "im:rating" not in entry:
            # First entry is sometimes app metadata, not a review.
            continue
        reviews.append({
            "rating": int(entry["im:rating"]["label"]),
            "title": entry.get("title", {}).get("label", "").strip(),
            "text": entry.get("content", {}).get("label", "").strip(),
        })
        if len(reviews) >= REVIEWS_PER_APP:
            break
    return reviews


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


def load_existing_bundle_ids(db_url: str) -> set[str]:
    """Return bundleIds (packageNames) of iOS apps already in MongoDB."""
    client = MongoClient(db_url)
    db = client[_db_name_from_url(db_url)]
    docs = list(db["apps"].find({"os": "ios"}, {"packageName": 1}))
    client.close()
    return {d["packageName"] for d in docs if d.get("packageName")}


# ---------------------------------------------------------------------------
# Scoring / filtering
# ---------------------------------------------------------------------------


def quality_score(app: dict) -> float:
    """0–1 score weighting rating (60%) and log-normalised review count (40%)."""
    rating = (app.get("averageUserRating") or 0.0) / 5.0
    reviews = app.get("userRatingCount") or 0
    review_score = math.log10(reviews) / math.log10(1_000_000) if reviews > 0 else 0.0
    return round(0.6 * rating + 0.4 * min(review_score, 1.0), 4)


def is_game(app: dict) -> bool:
    if app.get("primaryGenreId") == 6014:
        return True
    genres = set(app.get("genres") or [])
    return bool(genres & GAME_GENRE_NAMES)


def is_paid(app: dict) -> bool:
    # The RSS feed (topfreeapplications) already restricts to free apps, but
    # price can change between charting and lookup, so double-check.
    price = app.get("price") or 0.0
    return price > 0.0


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main(args: argparse.Namespace) -> None:
    db_url = args.db_url or os.environ.get("DATABASE_URL", "")
    if not db_url:
        sys.exit("MongoDB connection string required: set DATABASE_URL or pass --db-url.")

    # ── Step 1: collect IDs from RSS feeds ───────────────────────────────────
    print("Fetching top app IDs from iTunes RSS feeds…")
    # Map trackId → genre name it was first seen under.
    all_ids: dict[str, str] = {}
    for genre_id, genre_name in tqdm(GENRES.items(), desc="RSS genres"):
        for app_id in fetch_top_ids_for_genre(genre_id):
            if app_id not in all_ids:
                all_ids[app_id] = genre_name

    print(f"Collected {len(all_ids)} unique app IDs across {len(GENRES)} genres.")

    # ── Step 2: batch lookup full metadata ───────────────────────────────────
    print("Fetching metadata via iTunes Lookup API…")
    id_list = list(all_ids.keys())
    batches = [
        id_list[i : i + LOOKUP_BATCH_SIZE]
        for i in range(0, len(id_list), LOOKUP_BATCH_SIZE)
    ]
    all_apps: list[dict] = []
    for batch in tqdm(batches, desc="Lookup batches"):
        all_apps.extend(fetch_metadata_batch(batch))
    print(f"Retrieved metadata for {len(all_apps)} apps.")

    # ── Step 3: filter games and paid apps ───────────────────────────────────
    before = len(all_apps)
    all_apps = [a for a in all_apps if not is_game(a)]
    print(f"Removed {before - len(all_apps)} games → {len(all_apps)} remaining.")

    before = len(all_apps)
    all_apps = [a for a in all_apps if not is_paid(a)]
    print(f"Removed {before - len(all_apps)} paid apps → {len(all_apps)} remaining.")

    # ── Step 4: filter apps already in DB ────────────────────────────────────
    print("Checking MongoDB for existing iOS apps…")
    existing_bundle_ids = load_existing_bundle_ids(db_url)
    before = len(all_apps)
    all_apps = [a for a in all_apps if a.get("bundleId") not in existing_bundle_ids]
    print(f"Removed {before - len(all_apps)} already-in-DB apps → {len(all_apps)} remaining.")

    # ── Step 5: score and take top N ─────────────────────────────────────────
    for app in all_apps:
        app["_score"] = quality_score(app)
    all_apps.sort(key=lambda a: a["_score"], reverse=True)
    sampled = all_apps[: args.limit]
    print(f"Sampled top {len(sampled)} apps by quality score.")

    # ── Step 6: fetch reviews ────────────────────────────────────────────────
    print(f"Fetching up to {REVIEWS_PER_APP} reviews per app…")
    for app in tqdm(sampled, desc="Reviews"):
        app["_reviews"] = fetch_reviews(str(app["trackId"]))

    # ── Step 7: normalise output ─────────────────────────────────────────────
    results = []
    for app in sampled:
        results.append({
            "trackId":      str(app["trackId"]),
            "bundleId":     app.get("bundleId", ""),
            "name":         app.get("trackName", ""),
            "company":      app.get("sellerName", ""),
            "description":  app.get("description", ""),
            "icon":         app.get("artworkUrl512", ""),
            "cover":        app.get("artworkUrl512", ""),
            "rating":       app.get("averageUserRating"),
            "reviews":      app.get("userRatingCount"),
            "genre":        app.get("genres") or [],
            "primaryGenre": app.get("primaryGenreName", ""),
            "url":          app.get("trackViewUrl"),
            "score":        app["_score"],
            "userReviews":  app.get("_reviews", []),
        })

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "scrapedAt": datetime.now(timezone.utc).isoformat(),
        "appCount":  len(results),
        "apps":      results,
    }
    with open(output_path, "w") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    print(f"\nDone. {len(results)} apps saved to {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--limit", type=int, default=DEFAULT_LIMIT,
        help=f"Max apps to keep after quality scoring (default {DEFAULT_LIMIT}).",
    )
    parser.add_argument(
        "--output", default=str(OUTPUT_DEFAULT),
        help="Output JSON path (default: new-apps.json).",
    )
    parser.add_argument(
        "--db-url", default="",
        help="MongoDB connection string. Falls back to DATABASE_URL env var.",
    )
    main(parser.parse_args())
