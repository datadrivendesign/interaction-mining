# Safari: exact frame extraction is unreliable in the iOS annotate panel

Status: **cause identified, replacement path validated, not yet built.** The
twelve-commit investigation was reverted to `7c4035d` in `5bcb9ae`, so the bug is
still live in the product. The cause is [WebKit
#153588](https://bugs.webkit.org/show_bug.cgi?id=153588) (open since 2016) and
ffmpeg.wasm is measured correct on the failing recording — see "Spike result"
below. This records what was measured so the next attempt does not re-derive it.

## Symptom

On Safari, the frame shown once the playhead settles can be from a completely
different part of the recording — timestamp 00:26 with a picture from 00:37 —
and `c` captures the same wrong picture with the right timestamp. Intermittent,
and it survived twelve commits of fixes.

## What is measured, and trustworthy

All on Safari, macOS, with an 888x1920 iOS screen recording. Frames were
compared with a 36-point luminance grid plus a rolling signature, using the
preview thumbnails as a control.

| Claim | Evidence |
|---|---|
| `drawImage` on the **displayed** element returns one constant frame regardless of position | signature `498574917` at 5s, 10s, 15s and 20s, while the thumbnail control returned four distinct, repeatable values |
| The displayed element does not visibly repaint after a paused seek | QA: the panel does not change for any `j`/`l` keystroke |
| `requestVideoFrameCallback` never fires for a paused seek | every `reveal` in every log is `source: "timeout"`, `mediaTime: null` |
| A **long-lived detached** element freezes | signature `266794684` at seven distinct positions spanning 12s of recording, across two sessions |
| A **freshly primed detached** element is *sometimes* correct and sometimes not | thumbnail control varied correctly per position in one session; in another, every thumbnail in the grid returned `30238186` |
| `currentTime` reports the requested position, not the decoded one | assigning it moves the official playback position immediately; reads answer with the request while the previous frame is still displayed |

The last row of that table is why no canvas-based approach was made to work: the
one path with evidence behind it — extraction from a fresh element, which is
where the thumbnails come from — is not reliable across sessions.

## Dead ends, and why each looked right

1. **Diagonal fingerprint.** Sampled five points along the diagonal, which on a
   letterboxed recording lands in the black bars. Constant for every frame
   regardless of content. Produced two confident wrong conclusions before it was
   caught. Any future measurement needs a control measured the same way.
2. **"The reader is frozen, so the element must be fine."** Identical signatures
   were read as one frozen frame when a static stretch of a screen recording
   explains them equally well. Two readings that agree prove nothing when
   neither is calibrated.
3. **"The element composites fine, only readback is stale."** Contradicted a day
   later by the panel not changing at all under `j`/`l`.
4. **Idle-pipeline suspension.** Fitted one log well (a correct read at the end
   of a drag, a stale read after four seconds idle) and was refuted by the next,
   where seeks 500ms apart were all stale.

## Real defects found along the way

These were genuine and are worth re-fixing on their own merits, independently of
the display bug. They are in the reverted commits and can be cherry-picked.

- `extractVideoThumbnails` never tears down the element it creates, leaking a
  live media element per call — two per bootstrap — for the session. Browsers
  cap concurrent video decoders. (`674b8d8`)
- Its wait for `loadedmetadata` has no error path and no deadline, so an element
  that never gets a decoder hangs the function forever and leaves an empty
  thumbnail grid with nothing logged. A scrub with no preview and no badge is
  what that looks like from the outside. (`674b8d8`)
- Reads from one shared element are not serialized; two overlapping seeks
  resolve on each other's `seeked` and leave the decoder where neither caller
  asked. `extractVideoThumbnails` already knows this ("parallel messes up
  seeking") and runs its own loop sequentially. (`e8ff0bf`)
- `seekVideoToTime` waits for a `seeked` that never comes when asked for the
  position the element already holds. Capturing at the current playhead is
  exactly that case. (`c9e2a56`)

## Corroborated against WebKit's own bug tracker (2026-08-07)

**[WebKit bug #153588](https://bugs.webkit.org/show_bug.cgi?id=153588) — "drawImage
doesn't paint the current frame of a video".** Reported against Safari 9, and the
reporter's words are ours: *"ctx.drawImage(video, ...) only paints the first frame
of video regardless of its currentTime."* Still **NEW / unresolved**, with reports
continuing through iOS 13.3.1 and no resolution as of the last activity. Noted as
**intermittent**, needing several page refreshes to reproduce — which is exactly
why our thumbnails were correct in one session and identical-for-every-position in
the next, and why this took twelve commits to corner.

Workarounds listed in that bug, none usable here: draw twice with a ~1s gap
between; switch desktops, tabs, or go fullscreen; or hide the element and play it.
All of them amount to forcing a presentation, and none is acceptable on a
per-settle basis in an annotation tool.

Ruled out as our cause:

- **[#237424](https://bugs.webkit.org/show_bug.cgi?id=237424)** — GPU-process
  canvas rendering producing a black canvas from video. **RESOLVED FIXED**, and
  our frames were never actually black (that reading came from the broken sampler).
- No WebKit bug found for `requestVideoFrameCallback` not firing on paused seeks.
  That one stays our own measurement, uncorroborated; the nearest known case is
  rVFC not firing under DRM, which does not apply.

The consequence worth stating plainly: **the reverted-to baseline is exposed to
this bug too.** The preview thumbnail grid is built with `drawImage(video)`, so it
is correct by luck rather than by construction. Living with the bug is not a
stable state, it is an untriggered one.

## Where to go next

Since #153588 is an unresolved bug in `drawImage(video)` itself, the fix has to
stop reading pixels out of a media element. There is no browser version to wait
for and no way to drive the element correctly. Three candidates:

### 1. ffmpeg.wasm — already a dependency

`@ffmpeg/ffmpeg` and `@ffmpeg/util` are in `package.json` (0.12.x) and **used
nowhere in `src/`**. Someone intended this before; `extractVideoFrame` still
carries a docstring claiming it "uses the WebCodecs API" when it uses canvas.

- No media element, no canvas-from-video, so #153588 cannot apply.
- Handles both containers we accept (`.mp4`, `.mov`) and any codec, including
  HEVC recordings, without per-codec branching.
- Input-side seeking (`-ss` before `-i`) is a keyframe seek, so a single frame is
  cheap; the whole thumbnail grid can come from one invocation with an `fps`
  filter, which may beat 52-90 sequential element seeks.
- Costs: the wasm binary must actually ship, and decoding runs on the CPU. Wants
  a worker so bootstrap does not block.

### 2. WebCodecs `VideoDecoder`

- Available in Safari **16.4+**: that release shipped the *video* interfaces only
  — `VideoDecoder`, `VideoEncoder`, `EncodedVideoChunk`, `VideoFrame` — which is
  precisely the subset needed. Full WebCodecs is Safari 26.0+.
- Fastest per frame, hardware-backed.
- Needs a demuxer (mp4box.js is MP4-only; web-demuxer covers more) plus
  keyframe-relative decode, and codec support has to be probed rather than
  assumed. Most code, most risk.

### 3. Server-side ffmpeg

- Completely immune, zero client cost, and the recordings are already in S3.
- Needs an endpoint and adds a round trip per frame. Good fit for `c` captures,
  probably too slow to drive the settled display on every scrub stop.

### Spike result: ffmpeg.wasm validated (2026-08-07)

Run in Safari 26.5.2, macOS, on `Calendar.MP4` — 42.53s, 888x1920, the recording
that misbehaved. Harness at `docs/investigations/safari-frame-extraction-spike/`.

**Correct frames.** 8 samples ~4.7s apart, extracted through ffmpeg.wasm and
through a `<video>` element independently. Both agreed at all 8 timestamps to
within one luminance unit. Repeated frames at 33.079s and 37.805s appeared in
*both* methods, so they are a static stretch of recording rather than a stale
read — two independent decoders do not invent the same duplicate.

**Exact frames.** 8 samples 0.067s apart across a transition at ~1s produced 5
distinct frames, with luma means ramping 87 → 88 → 26 → 12 → 4. Content resolving
at two-frame granularity rules out `-ss` snapping to keyframes, which would have
returned one or two frames for a 0.6s window.

Signatures are only comparable *within* a decode path: ffmpeg and WebKit round YUV
to RGB differently, and one channel unit reshuffles the hash. Luminance survives.

**The historical stale frames are now identified.** Same sampler, same code path,
so the app's logged signatures match specific moments of this recording:

| signature | luma | is the frame at | app was asked for |
| --- | --- | --- | --- |
| `376159680` | 1/19/4 | ~1.2-4.7s (dark stretch) | 28.4-33.3s |
| `266794684` | 15/119/65 | 33.1-37.8s | 12.6-24.6s |

The second matches QA's report of "timestamp 00:26 showing a frame from 00:37"
exactly. Stale reads were serving real frames from elsewhere in the recording,
which is what the symptom always was.

**Cost: ~66-140ms per warm frame** (245ms for the first, which is decoder warmup —
the 13.7MB `writeFile` happens before the timed loop, so it is not in these
numbers). Median 128ms excluding the first. Fast enough to drive the settled frame
directly on every scrub stop: the reveal already waits 100ms, and the thumbnail
covers the drag.

Two things would push it lower if needed. The frames are encoded to **PNG** here,
which is the slow choice for a 1.7MP image — JPEG or raw output straight onto a
canvas avoids most of it. And a batch (the thumbnail grid) wants one invocation
with an `fps` filter rather than one `-ss` seek per frame, which re-opens the input
each time.

**Deterministic across runs.** `631689888` / luma 15/118/65 came back for 33.079s,
34.024s and 37.805s in two separate runs, and 8.506s matched 9.451s to within one
luma unit. Same input, same output.

**What the spike cannot show:** it creates a fresh element seeked in a tight loop,
the one condition under which the element has always worked — including in the app,
which is why bootstrap thumbnails are correct. The element passing there is not
evidence against #153588; the app's failure needs a long-lived element with idle
gaps. Treat it as a reference decoder, not a reproduction.

### Chrome is unaffected (measured 2026-08-07)

Chrome 151, macOS, same recording and same 8 timestamps. The element path agreed
with ffmpeg.wasm at **all 8**, deltas of 0-1 luma units, and both methods flagged
the same static pair at 33.079s/37.805s. Element cost: 52ms median, 83ms max —
faster than ffmpeg.wasm, which measured 176ms median *in Chrome* (slower than the
128ms it managed in Safari).

Corroborating evidence that this is WebKit-specific, not a coincidence of one run:

- [WebKit #153588](https://bugs.webkit.org/show_bug.cgi?id=153588) is titled
  "REGRESSION (Safari 9)" and lives in WebKit's tracker. Repeated searches of the
  Chromium tracker found no counterpart — only unrelated drawImage performance
  regressions and a narrow "cannot draw the first frame before load" report.
- `requestVideoFrameCallback` **fires** in Chrome for paused seeks (measured p50
  38.2ms, p95 61.7ms, 0 stalls) and **never** fires in Safari, where every reveal
  fell to the timeout. rVFC fires when a frame is sent to the compositor, so Chrome
  firing it is positive evidence a new frame was composited — the exact thing
  Safari fails to do, seen from another angle.
- Every wrong-frame report in this investigation came from Safari.

**ffmpeg.wasm is deterministic across browsers.** All 8 signatures are *identical*
between the Chrome and Safari runs — 450243801, 844177006, 490314302, 339521032,
348800860, 84251944, 631689888, 631689888. Element signatures differ between
browsers (different YUV→RGB rounding) while luma agrees. So ffmpeg output does not
depend on the browser at all, which is the property that makes it a sound reference
and a sound fix.

**What this does not prove.** The harness seeks a fresh element in a tight loop —
the condition under which even Safari's element works. It does not reproduce the
app's conditions (long-lived element, idle gaps between reads, overlays on top).
Before relying on "use Chrome", run a real annotation session in Chrome and check
the settled frame against the scrubber after deliberate pauses.

### Cheapest mitigation: keep workers off Safari

Given the above, a browser check that warns or blocks on Safari is a small change
and addresses the data-quality problem now, where the ffmpeg rebuild is a
multi-day piece of work. If Safari support is later required, note that Chrome's
element path is 3x faster than ffmpeg.wasm there, so a browser-conditional source
(element on Chromium, ffmpeg on WebKit) is defensible even though one path is
tidier.

### Follow-up: existing traces may hold mismatched screens

`c` on Safari captured the right timestamp with the wrong picture, and those images
were written into traces and reviewed. Switching browsers does not repair data
already collected. A check is feasible with what exists: re-extract the frame at
each screen's timestamp with ffmpeg.wasm — deterministic, browser-independent — and
compare luminance against the stored image; large divergence flags a suspect
screen. Scope unknown until someone counts how many captures were made in Safari.

### Do this first, whichever is chosen

A **spike, not a feature**: extract frames at known timestamps from a real
recording in Safari, and check the 36-point signatures differ per position and
repeat per position. That is the experiment that would have ended this
investigation on day one, and no product code should be built on a path until it
passes. The offline harness at `experiments/ios-segmentation/` is a reasonable
place for it.

Until a fix lands, workers on Safari can be shown a wrong settled frame and are
annotating against it, which is worth saying out loud to the team.
