# prisma/scripts

One-off and recurring Node.js scripts for database maintenance, data export, and analytics.
All scripts are ESM (`.mjs`) and load environment variables from `prisma/.env.local` via `dotenv`.

Run any script with `-h` / `--help` for full usage.

## Directory layout

```
prisma/scripts/
├── admin/              Potentially destructive one-off operations
├── analytics/          Read-only statistics and exploration
├── capture-store/      Export/import between the database and a local capture_store directory
├── data/               Gitignored reference files (known-user-ids.json, metrics-*.json)
├── logs/               Runtime log files written by export-to-capture-store (gitignored)
├── migrations/         One-time data migrations — run once, then leave in place for history
├── task-curation/      DB export scripts that feed the Python task-curation pipeline
└── trace-repair/       Trace integrity audit and repair workflow (run in order)
```

---

## admin/

| Script | Purpose |
|--------|---------|
| `delete-trace.mjs` | Permanently delete a Trace and its screens. Requires `--id <traceId>`. Use `--dry-run` first. |
| `find-processing-user-apps-not-in-traces.mjs` | Find apps with PROCESSING captures that have no corresponding Trace, grouped by user. Useful for identifying annotation backlog. |

---

## analytics/

| Script | Purpose |
|--------|---------|
| `explore-capture-stats.mjs` | Aggregate and per-status counts (captures, traces, screens, apps) and approval-rate metrics per user. Supports `basic-stats` and `approval-metrics` operations. |
| `upload-baseline.mjs` | Upload reliability baseline from S3 (no database). `put-latency` parses S3 server access logs for PUT duration normalized by object size; `duplicate-uploads` finds byte-identical videos re-uploaded to the same capture. Supports `all` and `--json`. |

User IDs to exclude are loaded from `data/known-user-ids.json` (gitignored). If that file is absent the script falls back to an empty exclusion list.

`upload-baseline.mjs` reads AWS credentials from the standard credential chain rather than `.env.local`, and takes bucket names from flags or the environment — nothing account-specific is defaulted in source:

```bash
AWS_PROFILE=<profile> UPLOAD_BUCKET=<bucket> \
  node prisma/scripts/analytics/upload-baseline.mjs duplicate-uploads

AWS_PROFILE=<profile> UPLOAD_BUCKET=<bucket> ACCESS_LOG_BUCKET=<log-bucket> \
  node prisma/scripts/analytics/upload-baseline.mjs put-latency --days 7
```

`UPLOAD_BUCKET` falls back to `_AWS_UPLOAD_BUCKET` and the region to `_AWS_REGION`, so an existing AWS environment mostly works as-is. `--bucket`, `--log-bucket`, `--region` and `--profile` override.

The script issues only `ListObjectsV2` and `GetObject`. Access logs carry a remote IP but no requester identity, so it reports population-level statistics and never geolocates; pass `--cohort-file` with volunteered IP prefixes to compare a consented cohort. Background in `plans/bugs/long-haul-upload-reliability.md`.

---

## capture-store/

Scripts that move data between the database/S3 and a local `capture_store/` directory used by the trace annotation agent.

| Script | Purpose |
|--------|---------|
| `export-to-capture-store.mjs` | Download captures (video + interaction history + metadata) from S3/MongoDB into a local directory. Accepts `--capture-ids`, `--task-ids`, or `--json-file`. |
| `import-from-capture-store.mjs` | Upload LLM-corrected `interaction_history.json` files (or structured diffs) back to S3 as annotator drafts. |

**Draft priority** (export): latest S3 draft → `original-metadata.json` → MongoDB trace screens.
**Diff priority** (import): `<analyzer-output>/<captureId>.diff.json` → `interaction_history.json` as-is.

---

## migrations/

One-time scripts. Safe to re-run (idempotent where noted), but intended to be executed once per environment.

| Script | Purpose |
|--------|---------|
| `backfill-apps.mjs` | Backfill App records from legacy data. |
| `backfill-users.mjs` | Backfill User records. |
| `rename-app-stuff.mjs` | Rename fields in App/related records after a schema change. |
| `reorg-s3-dirs.mjs` | Reorganise S3 key prefixes. Requires AWS credentials in `.env.local`. |

---

## task-curation/

MJS scripts that export and filter data from the database to feed into the Python task-curation pipeline (now the `odim-curation-pipeline` repository). Typical workflow:

```
1. export-candidate-task-apps.mjs         → candidate-task-apps-export.json
2. filter-candidate-task-apps.mjs         → candidate-task-apps-filtered.json  (remove games + isTaken)
3. export-ios-apps-with-captures-or-traces.mjs → ios-apps-with-captures-or-traces.json  (exclusion list)
4. (hand off to the Python pipeline in the odim-curation-pipeline repository)
5. convert-ios-existing-apps-to-csv.mjs   → claimed-ios-apps.csv  (audit view)
```

| Script | Purpose |
|--------|---------|
| `export-candidate-task-apps.mjs` | Dump all `CandidateTaskApp` rows (with linked `App`) to JSON. |
| `filter-candidate-task-apps.mjs` | Remove `isTaken=true` and Games-category apps from the export. |
| `export-ios-apps-with-captures-or-traces.mjs` | List all apps that already have capture or trace data; used as an exclusion list during task assignment. |
| `convert-ios-existing-apps-to-csv.mjs` | Merge the exclusion list with `isTaken` candidate apps into a single CSV for manual review. |

---

## trace-repair/

Run these scripts **in order** when capture–trace linkage is suspected to be broken.

| Step | Script | Purpose |
|------|--------|---------|
| 1 | `diff-trace-sets.mjs` | Compute the symmetric difference between "all traces for platform X" and "traces referenced by captures". Outputs `match-report.json`. |
| 2 | `check-disjoint-traces.mjs` | Inspect the disjoint trace IDs from step 1 for missing fields, missing related records, and schema issues. |
| 3 | `match-disjoint-traces.mjs` | For each dangling `capture.traceId`, try to find the correct trace in the orphan set using backref or task-matching strategies. |
| 4 | `repair-disjoint-traces.mjs` | Apply the unique matches from step 3 to fix `capture.traceId` pointers. Dry-run by default; pass `--apply` to write. |

---

## data/

Gitignored files consumed by scripts at runtime:

| File | Contents |
|------|---------|
| `known-user-ids.json` | User ID lists used as filters in analytics queries (e.g. to exclude specific cohorts). Keep this file locally; never commit it. |
| `metrics-*.json` | Generated metrics snapshots (gitignored by pattern). |

---

## Related: the Python curation pipeline (separate repository)

The Python pipeline that scrapes new apps, writes and reviews their tasks, and
imports them into `candidate_task_apps` used to live at
`scripts/curation-pipeline/`. It moved to its own repository,
`odim-curation-pipeline`, in November 2026. It consumes the JSON exported by
the MJS scripts above.
