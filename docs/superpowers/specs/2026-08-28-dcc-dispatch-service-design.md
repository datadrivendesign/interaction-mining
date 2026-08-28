# DCC dispatch service — design spec

Date: 2026-08-28
Status: approved (A — includes schema change)

## Problem

`feature/capture-trace` added a Capture Trace request flow: a user submits a
URL/Play-Store-app + task description, which is saved as a `CrawlRequest` and
handed off through a stubbed seam (`dispatchCrawlRequestToDCC`, gated on
`DCC_DISPATCH_URL`). There is no service on the other end — `dcc` is a mature
CLI/library (`~/cs597_research/dcc`) with no HTTP server. The completion
endpoint (`/api/crawl-requests/[id]/complete`) is also a stub: unauthenticated,
and it explicitly declines to do anything for non-Play-Store (URL) targets.

## Goal (this sub-project)

Get a real `dcc run` to execute on D3PO for a submitted URL + task, and get
the outcome (success/fail + where the trace lives) back onto the
`CrawlRequest` row. **Not in scope:** turning the resulting trace into an
annotatable `Capture` with frames — that's a separate, larger data-modeling
project (DCC's web trace format — DOM tree + screenshots — doesn't map onto
the existing Android-view-hierarchy frame format the annotation pipeline
expects) and gets its own design later.

## Non-goals / constraints

- **Do not modify the `dcc` repo.** It's a separate, actively-developed
  project with its own collaborators and release process. It is consumed
  strictly as a built CLI binary (`node cli/dist/cli.js run ...`), never
  edited.
- V1 handles URL targets only. Play Store (Android) targets stay queued,
  same as today — driving those needs a maintained Android
  emulator/device on D3PO, out of scope here.
- Brain: local qwen via Ollama (D3PO already forwards port 11434 in
  `~/.ssh/config`; no API keys, no per-run cost).
- Reachability: direct HTTP from wherever interaction-mining runs to D3PO.
  Not verified in this session — D3PO was unreachable (no VPN active,
  SSH/ping both timed out). Deployment/testing on D3PO needs to happen
  when reachable.

## Architecture

```
interaction-mining (wherever deployed)
  createCrawlRequest()
    → dispatchCrawlRequestToDCC()
       POST http://d3po.cs.illinois.edu:5050/dispatch
       Authorization: Bearer <DCC_AUTH_TOKEN>
       { crawlRequestId, targetInput, description }
                                                          D3PO
                                          dcc-worker service (port 5050)
                                            - validates auth + payload
                                            - enqueues (FIFO, concurrency 1)
                                            - responds 202 immediately
                                            - CrawlRequest → DISPATCHED

                                          worker loop (one job at a time):
                                            spawn: node <dcc>/cli/dist/cli.js run
                                              --target web --url <targetInput>
                                              --goal <description> --brain qwen
                                              --trace-dir ~/.dcc/traces/crawl-<id>
                                              --max-steps 12 --max-ms 600000
                                            on exit: read <traceDir>/result.json
                                            POST completion back ──────────┐
                                                                           │
interaction-mining                                                       │
  POST /api/crawl-requests/[id]/complete  ◄────────────────────────────┘
    Authorization: Bearer <DCC_AUTH_TOKEN>
    { status: "success"|"infeasible"|"needs_help"|"budget_exhausted"|"error",
      error?: string, traceDir: string }
    → validates auth
    → CrawlRequest.status = COMPLETED | FAILED
    → CrawlRequest.traceDir = traceDir
    → CrawlRequest.error = error (if any)
```

## Component: dcc-worker (new, lives in interaction-mining repo)

`scripts/dcc-worker/` — a standalone Node script/service, alongside the
existing `scripts/curation-pipeline/` precedent for auxiliary tooling. Not
part of the Next.js app; deployed and run independently on D3PO.

- Plain Node `http` server, no framework dependency (matches the pattern of
  small single-purpose scripts elsewhere in this repo; avoids adding a new
  package for two routes).
- Routes:
  - `POST /dispatch` — body `{crawlRequestId, targetInput, description}`.
    Requires `Authorization: Bearer <DCC_AUTH_TOKEN>`. Validates the URL
    (must be `http(s)://`, reject anything else — Play Store package names
    etc. are filtered out on the interaction-mining side already, since
    `targetType` there is `URL` only when it's not a resolved Play Store
    app). Pushes onto an in-memory FIFO array. Responds `202 {accepted:true}`
    synchronously; never blocks on the run itself.
  - `GET /health` — liveness check for pm2 / manual poking.
- Worker loop: single in-process loop, `concurrency = 1` (shared box, local
  qwen is compute-heavy — don't contend with other users' jobs). Pops the
  queue, spawns the `dcc run` child process, awaits exit, reads
  `<traceDir>/result.json`, POSTs the completion callback with a small
  retry (e.g. 3 attempts, backoff) since a transient network blip shouldn't
  strand a finished run.
- **In-memory only.** A restart drops the queue and loses track of any
  in-flight job. Acceptable for v1 (documented limitation); a request lost
  this way just sits at `DISPATCHED` forever — a human can requeue it later
  once we have retry tooling. Not attempting persistence now.
- Config via env: `PORT` (default `5050`), `DCC_CLI_PATH` (path to `dcc`
  repo's `cli/dist/cli.js`), `DCC_AUTH_TOKEN`, `CALLBACK_BASE_URL` (the
  interaction-mining deployment to call back), `OLLAMA_HOST` (default
  `http://localhost:11434`, passed through to the child process env).

## Component: interaction-mining changes

- `prisma/schema.prisma`: add `traceDir String?` to `CrawlRequest` —
  additive, nullable, non-breaking.
- `src/lib/actions/crawl-request.ts`:
  - `dispatchCrawlRequestToDCC`: add `Authorization: Bearer
    ${process.env.DCC_AUTH_TOKEN}` header to the dispatch POST.
  - Fix existing bug: on dispatch failure, the catch block sets `error` but
    never updates `status` — it should also set `status: "FAILED"` so the
    request doesn't sit at `QUEUED` forever with no visible failure state.
- `src/app/api/crawl-requests/[crawlRequestId]/complete/route.ts`:
  - Validate `Authorization: Bearer <DCC_AUTH_TOKEN>` — reject
    unauthenticated calls with 401. This closes the TODO already in the
    file's header comment.
  - Accept the new payload shape (`status`, `error?`, `traceDir`).
  - For the URL-target case (the only case in scope): set
    `status: COMPLETED` when `status === "success"`, else `status: FAILED`
    with the reason recorded in `error`. Store `traceDir` regardless.
    Leave the existing Play-Store-app path untouched.
- `.env.example`: add `DCC_DISPATCH_URL`, `DCC_AUTH_TOKEN`.

## Deployment (D3PO)

- `dcc` repo already cloned/built on D3PO (or gets built there once,
  read-only from our side): `pnpm -r build`.
- `scripts/dcc-worker` copied/pulled onto D3PO, run under `pm2` (installed
  without root via `npm i -g pm2` in a user-owned prefix, or `npx pm2`) for
  restart-on-crash + log capture: `pm2 start dcc-worker/index.js --name
  dcc-worker`.
- A `scripts/dcc-worker/DEPLOY.md` documents the exact steps and required
  env vars, written as part of this work but **not executed by this
  session** — D3PO is unreachable right now (no VPN, SSH/ping both
  time out). Deployment is a manual follow-up once reachable.

## Failure modes / edge cases

- D3PO's `dcc-worker` down when `dispatchCrawlRequestToDCC` calls it: fetch
  throws/non-2xx → caught, `status: FAILED`, `error` recorded. User sees a
  failed request on their dashboard, no silent hang.
- `dcc run` process crashes or times out (`--max-ms`): `result.json` may be
  absent. Worker treats a missing/unparseable `result.json` as
  `status: "error"` with a generic message, still posts completion so the
  `CrawlRequest` doesn't hang at `DISPATCHED` forever.
- Completion callback itself fails after `dcc run` succeeds (network blip):
  retried a few times; if all retries fail, the run's result is only in the
  D3PO trace directory — logged locally on D3PO for manual recovery, request
  stays `DISPATCHED`. Acceptable for v1; not building a reconciliation job.
- Concurrent submissions: queued, not dropped — one job runs at a time.

## Testing plan

- Unit-ish: `dcc-worker`'s queue/worker logic testable in isolation by
  mocking `child_process.spawn`.
- Manual end-to-end once D3PO is reachable: submit a Capture Trace request
  against a simple public URL, confirm `DISPATCHED` → `COMPLETED`/`FAILED`
  transition and `traceDir` populated.
- `[Local]`/`[Amplify dev]` labels apply per `AGENTS.md` once manual testing
  is possible.
