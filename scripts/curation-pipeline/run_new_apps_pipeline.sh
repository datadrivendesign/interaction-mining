#!/usr/bin/env bash
# run_new_apps_pipeline.sh — Scrape, generate, and curate new app candidates.
#
# Steps:
#   1. Scrape top iOS apps from iTunes RSS + Lookup APIs → new-apps.json
#   2. Generate candidate tasks via Claude Haiku       → generated-tasks.json
#   3. Curate tasks via Claude Sonnet                  → curated-tasks-new.json
#
# The import step is intentionally NOT run here. After inspecting
# curated-tasks-new.json, run import manually:
#
#   python3 import_new_app_candidates.py --dry-run   # preview
#   python3 import_new_app_candidates.py --apply     # commit
#
# Usage:
#   ./run_new_apps_pipeline.sh [--limit N] [--rpm N] [--concurrency N]
#   ./run_new_apps_pipeline.sh --resume   # skip already-processed entries
#
# Environment variables required:
#   DATABASE_URL      MongoDB connection string
#   ANTHROPIC_API_KEY Anthropic API key

set -euo pipefail

WORKSPACE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$WORKSPACE/../.." && pwd)"

# Load .env from project root if present and vars aren't already exported.
if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$ROOT/.env"
  set +a
fi

NEW_APPS="$WORKSPACE/new-apps.json"
GENERATED="$WORKSPACE/generated-tasks.json"
CURATED="$WORKSPACE/curated-tasks-new.json"

# Defaults — override via flags below.
LIMIT=1500
RPM=40
CONCURRENCY_HAIKU=10
CONCURRENCY_SONNET=5
RESUME=""

# ---------------------------------------------------------------------------
# Parse flags
# ---------------------------------------------------------------------------

while [[ $# -gt 0 ]]; do
  case "$1" in
    --limit)        LIMIT="$2";              shift 2 ;;
    --rpm)          RPM="$2";                shift 2 ;;
    --concurrency)  CONCURRENCY_HAIKU="$2";
                    CONCURRENCY_SONNET="$2"; shift 2 ;;
    --resume)       RESUME="--resume";       shift   ;;
    *) echo "Unknown flag: $1" >&2; exit 1 ;;
  esac
done

# ---------------------------------------------------------------------------
# Validate environment
# ---------------------------------------------------------------------------

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  exit 1
fi

if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  echo "ERROR: ANTHROPIC_API_KEY is not set." >&2
  exit 1
fi

log() { echo; echo "━━━ $1 ━━━"; }

# ---------------------------------------------------------------------------

log "STEP 1 — Scraping iTunes RSS + Lookup APIs (limit=$LIMIT)"

python3 "$WORKSPACE/scrape_appstore_apps.py" \
  --limit  "$LIMIT" \
  --output "$NEW_APPS"

# ---------------------------------------------------------------------------

log "STEP 2 — Generating tasks via Claude Haiku"

python3 "$WORKSPACE/generate_new_app_tasks.py" \
  --input       "$NEW_APPS" \
  --output      "$GENERATED" \
  --rpm         "$RPM" \
  --concurrency "$CONCURRENCY_HAIKU" \
  $RESUME

# ---------------------------------------------------------------------------

log "STEP 3 — Curating tasks via Claude Sonnet"

python3 "$WORKSPACE/curate_new_app_tasks.py" \
  --input       "$GENERATED" \
  --output      "$CURATED" \
  --rpm         "$RPM" \
  --concurrency "$CONCURRENCY_SONNET" \
  $RESUME

# ---------------------------------------------------------------------------

log "DONE — inspect before importing"
echo
echo "Output files:"
echo "  Scraped apps   : $NEW_APPS"
echo "  Generated tasks: $GENERATED"
echo "  Curated tasks  : $CURATED"
echo
echo "When ready to import, run:"
echo "  python3 $WORKSPACE/import_new_app_candidates.py            # dry run"
echo "  python3 $WORKSPACE/import_new_app_candidates.py --apply    # commit"
