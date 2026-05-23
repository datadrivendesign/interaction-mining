# from-dcc — DCC trace → ODIM capture-store converter

Converts a finished [DCC](https://github.com/datadrivendesign/dcc) trace directory into
ODIM's capture-store format so the QC pipeline (`analyze.ts`) can score it.

## Usage

```bash
cd scripts/trace-analyzer
npm install
tsx from-dcc/bin.ts <traceDir> --out <captureStore> [--ios <version>] [--iphone <model>]
```

`<traceDir>` is the path DCC prints after `dcc run` completes.  
`<captureStore>` is the root directory of the capture store (created if absent).  
The converter writes `<captureStore>/<id>/interaction_history.json` and `recording.mp4`.

After conversion, run the QC pipeline:

```bash
tsx analyze.ts --trace <id> --skip-vision   # fast, no vision pass
tsx analyze.ts --trace <id>                  # full vision pass (requires ffmpeg + OmniParser)
```

## DCC trace shape (as of commit a339003)

```
<traceDir>/
  session.json          SessionMetadata { goal, startedAt, budget }
  steps/
    0001/
      frame.json        FrameJson { platform, viewport, locator, capturedAt, semanticTree }
      record.json       StepRecord { step, reason, reflection, action, latencyMs, capturedAt }
      screenshot.png
    0002/ ...
  result.json           SessionResult { status, steps, findings, error? }
```

Step directories are 4-digit zero-padded. `semanticTree` may be `null`.

## Action mapping

| DCC action | ODIM gesture | coords | deltas |
|---|---|---|---|
| `click` | `tap` | from target | — |
| `type` | `typing` | from target, or inherit prior tap | — |
| `scroll up` | `swipe up` | null, null | scrollDeltaY = -0.3 |
| `scroll down` | `swipe down` | null, null | scrollDeltaY = +0.3 |
| `scroll left` | `swipe left` | null, null | scrollDeltaX = -0.3 |
| `scroll right` | `swipe right` | null, null | scrollDeltaX = +0.3 |
| `key`, `navigate_back`, `navigate_home`, `wait`, `finding` | dropped | — | — |
| `done` | trailing null-gesture screen | — | — |

Steps with an unresolved `by:description` target are also dropped.

## Coordinate normalization

DCC `by:pixel` targets carry `[0,1]` normalized coordinates — used as-is.  
DCC `by:index` targets are resolved via `semanticTree`: find the element whose
`.index` matches, then normalize `center.x / viewport.width`, `center.y / viewport.height`.

## Vendored DCC types

`vendored-dcc-types.ts` copies the minimum type surface from DCC's `core/src/types/`.
The SHA at the top of that file is the DCC commit they were read from.
When DCC's trace shape changes, update the SHA, re-copy the affected types, and
re-run the tests — `convert.test.ts` will catch obvious drift.

## Running tests

```bash
cd scripts/trace-analyzer
npm test
```

Uses Node.js built-in `node:test` via `tsx --test`. No additional test framework needed.
