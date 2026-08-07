# Spike: can ffmpeg.wasm extract exact frames in Safari?

Kept for the record. Answers one question before any product code is written:

> In Safari, on a real iOS capture recording, does ffmpeg.wasm return a **distinct,
> correct** frame per timestamp — where `drawImage` from a `<video>` element does
> not?

Nothing in `src/` is touched. This lives on the `safari-frame-investigation`
branch alongside the findings it produced; it is not part of any shipped build.

## Setup (once)

Everything is vendored into `vendor/`; there is no CDN at runtime. `@ffmpeg/ffmpeg`
and `@ffmpeg/util` come from `node_modules`, and only the core wasm needs
downloading. Already done if `vendor/core/ffmpeg-core.wasm` is ~32MB.

```sh
cd docs/investigations/safari-frame-extraction-spike
mkdir -p vendor/ffmpeg vendor/util vendor/core
cp ../../../node_modules/@ffmpeg/ffmpeg/dist/esm/*.js vendor/ffmpeg/
cp ../../../node_modules/@ffmpeg/util/dist/esm/*.js  vendor/util/
# dist/esm, NOT dist/umd — see below. Version must match CORE_VERSION in
# vendor/ffmpeg/const.js, currently 0.12.9.
curl -fsSLO https://unpkg.com/@ffmpeg/core@0.12.9/dist/esm/ffmpeg-core.js  --output-dir vendor/core
curl -fsSLO https://unpkg.com/@ffmpeg/core@0.12.9/dist/esm/ffmpeg-core.wasm --output-dir vendor/core
```

Vendoring rather than using a CDN is not tidiness, it is the fix for two silent
hangs:

- ffmpeg.wasm builds its worker with `new URL("./worker.js", import.meta.url)`.
  Load the class from a CDN and that resolves cross-origin, the worker never
  starts, and `load()` waits forever while the page still says "loading".
- A wrong CDN version 404s into an HTML page, and `toBlobURL` will hand that to
  the worker as JavaScript without complaint. Same symptom.

And a third, which is why the `esm` path above matters: `classes.js` creates the
worker with `type: "module"` unconditionally, so `importScripts` always throws and
the real path is `(await import(coreURL)).default`. The **UMD** core has no default
export. `worker.js` papers over this by rewriting `/umd/` to `/esm/` — but only
when no explicit `coreURL` was passed, so a local UMD file fails with just
`failed to import ffmpeg-core.js`. Use `dist/esm`; the wasm is byte-identical
either way, only the JS glue differs.

The page now HEAD-checks both core files for plausible sizes, greps the core JS
for a default export, and puts a 120s deadline on `load()` — so each of these
three reports itself instead of looking busy or naming the wrong cause.

## Run it

Needs a real HTTP origin — `file://` refuses the worker.

```sh
python3 -m http.server 8765 --directory docs/investigations/safari-frame-extraction-spike
```

Then open <http://localhost:8765> **in Safari**, pick a recording, press Run.
`vendor/` is gitignored by this directory's own `.gitignore`, so the 32MB is
never committed — the setup step above reconstructs it.

Use an actual capture recording, ideally the one that misbehaved. A recording of
something else has different keyframe spacing and codec settings, and this bug is
sensitive to both.

## Settings

Two runs, because they test different things and both have to pass.

**Run 1 — is the read stuck on one frame?** The main event.

| Setting | Value |
| --- | --- |
| Recording | the capture that actually misbehaved |
| Samples | `8` |
| Spread over | *blank* (whole recording) |
| Centred at | *blank* |
| Test the element | **checked** |

Eight samples across a 40s-ish recording lands them ~5s apart, which is the
spacing the wrong-frame bug showed up at: the same signature at 5s, 10s, 15s and
20s.

**Run 2 — is ffmpeg decoding to the exact timestamp?** Guards against `-ss`
snapping to the nearest keyframe, which would make every frame plausible and every
frame wrong.

| Setting | Value |
| --- | --- |
| Samples | `8` |
| Spread over | `0.6` |
| Centred at | a second where the screen is **moving** |
| Test the element | unchecked (not what is being tested, and halves the time) |

`0.6s` over 8 samples is ~0.067s apart — two frames at 30fps, so every sample
should be a different frame. Picking the centre matters more than anything else
here: over half a second of a static app screen, identical frames are the honest
answer and cannot be distinguished from a broken read. Scrub the capture in the
app first, find a scroll or a transition, and use that timestamp.

## Reading the result

The page samples N interior timestamps and extracts each one twice — once through
ffmpeg.wasm, once through the current pipeline — reducing every frame to the same
36-point signature the in-app profiler uses, so numbers are comparable across
both.

**Read the Cross-check table, not the duplicate counts.** Duplicates on their own
say nothing — a static stretch of a screen recording repeats honestly. What
settles it is whether an independent decoder agrees, *including* agreeing that two
moments look the same.

- **All timestamps agree, duplicates match** → ffmpeg.wasm is correct here, and any
  repeated frames are static recording. Two independent decoders do not invent the
  same duplicate. Green light.
- **Methods disagree at some timestamps** → one of them is returning the wrong
  frame. Compare the strips to see which.
- **Only one method run** → consistency, not correctness. Re-run with the element
  test on.

Signatures are **not comparable across methods**: ffmpeg and WebKit round YUV to
RGB differently, and a one-unit channel difference reshuffles the hash completely.
Luminance survives it, which is what the cross-check compares. Signatures *are*
comparable within a method, and across sessions using the same method — which is
how the app's historical stale frames were later identified as specific moments in
the recording.

### What this harness cannot show

It creates a fresh element and seeks it in a tight loop — the one condition under
which the element has *always* worked, in the app too (that is why bootstrap
thumbnails are correct). So the element passing here is expected and is **not**
evidence against
[WebKit 153588](https://bugs.webkit.org/show_bug.cgi?id=153588). The app's failure
needs a long-lived element with idle gaps between reads, which this page does not
reproduce. Use the element here as a *reference decoder*, not as a reproduction.

Timing is printed in the log. The core is local, so the only first-run cost is
reading and compiling 32MB of wasm.

## Exporting a run

**Copy results as JSON** next to the Run button puts the whole run on the
clipboard: user agent, recording metadata, the exact sample times, and per method
the distinct-signature count, per-frame signature and luma, and per-frame
milliseconds. Safari sometimes refuses a clipboard write it does not consider
user-initiated, in which case the JSON appears in a box to copy by hand.

Image URLs are deliberately left out — a `blob:` or `data:` URL is meaningless
once pasted somewhere else.

Which means **the JSON cannot show whether a frame is the *right* frame.**
Signatures only establish that frames differ from each other. If a frame looks
like the wrong screen, or the strip does not march forward through the recording,
screenshot it: that is a different and worse result than duplicates, and nothing
in the export would reveal it.

## Two things this spike also settles

- **How slow is it.** Per-frame cost decides whether ffmpeg.wasm can drive the
  settled frame directly or only `c` captures, with the thumbnail grid covering
  the gap.
- **Whether `.mov` works.** iOS recordings arrive as both `.mp4` and `.mov`, and
  the container is passed through to ffmpeg here.

## If it passes

`@ffmpeg/core` is **not** currently a dependency — only `@ffmpeg/ffmpeg` and
`@ffmpeg/util` are, and neither is imported anywhere in `src/`. So productionising
this means adding `@ffmpeg/core`, serving the 32MB wasm from our own origin, and
running extraction off the main thread so bootstrap does not block on CPU decode.

Carry the three traps above into that work: the ESM core is required, the worker
is always a module worker, and every URL wants a preflight — all three failed
silently or misleadingly here.
