#!/usr/bin/env bash
# run_pipeline.sh — Full task curation and worker assignment pipeline.
#
# Steps:
#   1. Curate all apps in candidate-task-apps-export.json (resumes from existing work)
#   2. Clean up tasks (placeholder emails + length > 75 chars)
#   3. Assign apps to workers (fresh reshuffle)
#   4. Export worker PDFs
#
# Usage:
#   ./run_pipeline.sh
#   ./run_pipeline.sh --rpm 50 --concurrency 15   # pass extra flags to curate_tasks.py only

set -euo pipefail

WORKSPACE="$(cd "$(dirname "$0")" && pwd)"
EXPORT="$WORKSPACE/candidate-task-apps-export.json"
CURATED="$WORKSPACE/candidate-task-apps-export-curated.json"
EXISTING="$WORKSPACE/curated-tasks.json"
ASSIGNMENTS="$WORKSPACE/worker-assignments"

# Extra args forwarded only to curate_tasks.py (e.g. --rpm, --concurrency)
CURATE_ARGS="${*}"

# ---------------------------------------------------------------------------
log() { echo; echo "━━━ $1 ━━━"; }
# ---------------------------------------------------------------------------

# Validate required files exist before starting
if [ ! -f "$EXPORT" ]; then
  echo "ERROR: $EXPORT not found." >&2
  exit 1
fi

if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  echo "ERROR: ANTHROPIC_API_KEY is not set." >&2
  exit 1
fi

# ── Step 1 — Curate ────────────────────────────────────────────────────────
log "STEP 1 — Curating tasks from full export"

# Seed the new output file with any existing curated work so --resume can skip it.
if [ -f "$EXISTING" ] && [ ! -f "$CURATED" ]; then
  echo "Seeding $CURATED from existing $EXISTING …"
  cp "$EXISTING" "$CURATED"
elif [ ! -f "$CURATED" ]; then
  echo "No existing curated file found — starting fresh."
fi

python3 "$WORKSPACE/curate_tasks.py" \
  --input  "$EXPORT" \
  --output "$CURATED" \
  --resume \
  $CURATE_ARGS

# ── Step 2 — Cleanup ───────────────────────────────────────────────────────
log "STEP 2 — Cleaning up tasks (emails + length)"

python3 "$WORKSPACE/cleanup_tasks.py" \
  --input "$CURATED" \
  --apply

# ── Step 3 — Assign ────────────────────────────────────────────────────────
log "STEP 3 — Assigning apps to workers"

python3 "$WORKSPACE/assign_tasks.py" \
  --input      "$CURATED" \
  --output-dir "$ASSIGNMENTS"

# ── Step 4 — Export PDFs ───────────────────────────────────────────────────
log "STEP 4 — Exporting worker PDFs"

python3 "$WORKSPACE/export_worker_pdfs.py" \
  --input-dir  "$ASSIGNMENTS" \
  --output-dir "$ASSIGNMENTS"

# ---------------------------------------------------------------------------
log "DONE"
echo "Curated tasks : $CURATED"
echo "Assignments   : $ASSIGNMENTS"
