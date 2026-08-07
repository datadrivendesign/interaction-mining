/**
 * Test the theory: for each capture whose `traceId` is dangling
 * (i.e. appears in `onlyInCaptureFilter`), the *correct* trace might already
 * exist in `onlyInAppFilter` and can be identified.
 *
 * Reads diff-trace-sets.mjs output and produces a report describing how many
 * dangling capture references can be explained by matching against orphan traces.
 *
 * Strategies (selectable via --strategy):
 *   - backref  Match `trace.captureId === capture.id` (default; explicit link from trace).
 *              Each unique match also sanity-checks that the orphan trace's taskId/appId
 *              match the capture's, and is downgraded to no-match if not.
 *   - task     Three task-based heuristic levels (most → least strict):
 *                1. taskId + appId + userId
 *                2. taskId + appId
 *                3. taskId
 *   - both     Run both. The backref level appears first; downstream tooling
 *              should still pick a single level by name.
 *
 * For each level the script reports:
 *   - howManyDanglingCapturesHaveExactlyOneCandidate
 *   - howManyHaveMultipleCandidates
 *   - howManyHaveNoCandidate
 *   - explainedOrphanTraceIds (subset of onlyInAppFilter that are someone's
 *     unique candidate at this level)
 *
 * Usage:
 *   node prisma/scripts/match-disjoint-traces.mjs
 *   node prisma/scripts/match-disjoint-traces.mjs --strategy task
 *   node prisma/scripts/match-disjoint-traces.mjs -i prisma/scripts/trace-diff.json -o match-report.json
 */

import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_INPUT = "prisma/scripts/trace-repair/trace-diff.json";
const EMPTY_OBJECT_ID = "000000000000000000000000";

/** @typedef {{ id: string; traceId: string; taskId: string; appId: string; userId: string | null }} CaptureRow */
/** @typedef {{ id: string; taskId: string; appId: string; userId: string | null; captureId: string | null }} TraceRow */

const STRATEGIES = /** @type {const} */ ({
  BACKREF: "backref",
  TASK: "task",
  BOTH: "both",
});

/** @param {unknown} v */
function isStrategy(v) {
  return (
    v === STRATEGIES.BACKREF || v === STRATEGIES.TASK || v === STRATEGIES.BOTH
  );
}

/**
 * Read and validate the diff-trace-sets.mjs output file.
 * @param {string} filePath
 * @returns {Promise<{
 *   platform: string;
 *   onlyInAppFilter: string[];
 *   onlyInCaptureFilter: string[];
 * }>}
 */
async function loadDiffFile(filePath) {
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  if (
    !Array.isArray(parsed.onlyInAppFilter) ||
    !Array.isArray(parsed.onlyInCaptureFilter)
  ) {
    throw new Error(
      `Unexpected JSON shape at ${filePath}: missing onlyInAppFilter / onlyInCaptureFilter arrays`,
    );
  }
  return parsed;
}

/**
 * Fetch every capture whose `traceId` is one of the dangling IDs.
 *
 * Intentionally does NOT filter by status or user: data-integrity issues are
 * independent of who owns the capture or what state it's in, and we want to
 * surface (and eventually repair) every broken reference. Platform is kept as
 * a sanity check so we don't accidentally pull captures from another OS.
 *
 * @param {import("@prisma/client").PrismaClient} db
 * @param {string} platform
 * @param {string[]} danglingTraceIds
 * @returns {Promise<CaptureRow[]>}
 */
async function fetchDanglingCaptures(db, platform, danglingTraceIds) {
  if (danglingTraceIds.length === 0) return [];
  const rows = await db.capture.findMany({
    where: {
      app: { os: platform },
      traceId: { in: danglingTraceIds },
    },
    select: {
      id: true,
      traceId: true,
      taskId: true,
      appId: true,
      userId: true,
    },
  });
  return rows.filter(
    /** @returns {row is CaptureRow} */ (row) => row.traceId !== null,
  );
}

/**
 * Fetch the orphan traces (onlyInAppFilter), with the keys we'll match on.
 * Includes `captureId` for the backref strategy.
 * @param {import("@prisma/client").PrismaClient} db
 * @param {string[]} traceIds
 * @returns {Promise<TraceRow[]>}
 */
async function fetchOrphanTraces(db, traceIds) {
  if (traceIds.length === 0) return [];
  return db.trace.findMany({
    where: { id: { in: traceIds } },
    select: {
      id: true,
      taskId: true,
      appId: true,
      userId: true,
      captureId: true,
    },
  });
}

/**
 * Build an index of `TraceRow[]` keyed by a string key.
 * @param {TraceRow[]} traces
 * @param {(t: TraceRow) => string | null} keyFn
 * @returns {Map<string, TraceRow[]>}
 */
function indexTracesBy(traces, keyFn) {
  /** @type {Map<string, TraceRow[]>} */
  const map = new Map();
  for (const t of traces) {
    const key = keyFn(t);
    if (key === null) continue;
    const bucket = map.get(key);
    if (bucket) bucket.push(t);
    else map.set(key, [t]);
  }
  return map;
}

/**
 * Resolve candidate traces for a capture by matching on a key.
 * @param {CaptureRow} capture
 * @param {(c: CaptureRow) => string | null} captureKey
 * @param {Map<string, TraceRow[]>} traceIndex
 * @returns {TraceRow[]}
 */
function findCandidates(capture, captureKey, traceIndex) {
  const key = captureKey(capture);
  if (key === null) return [];
  return traceIndex.get(key) ?? [];
}

/**
 * Run one match-strictness level over all dangling captures and summarize.
 * @param {string} levelName
 * @param {CaptureRow[]} captures
 * @param {Map<string, TraceRow[]>} traceIndex
 * @param {(c: CaptureRow) => string | null} captureKey
 */
function evaluateMatchLevel(levelName, captures, traceIndex, captureKey) {
  const uniqueMatches = [];
  const multipleMatches = [];
  const noMatch = [];

  for (const capture of captures) {
    const candidates = findCandidates(capture, captureKey, traceIndex);
    if (candidates.length === 0) {
      noMatch.push(capture.id);
    } else if (candidates.length === 1) {
      uniqueMatches.push({
        captureId: capture.id,
        currentTraceId: capture.traceId,
        suggestedTraceId: candidates[0].id,
        capture: {
          taskId: capture.taskId,
          appId: capture.appId,
          userId: capture.userId,
        },
      });
    } else {
      multipleMatches.push({
        captureId: capture.id,
        currentTraceId: capture.traceId,
        candidateTraceIds: candidates.map((c) => c.id),
      });
    }
  }

  const explainedOrphanTraceIds = Array.from(
    new Set(uniqueMatches.map((m) => m.suggestedTraceId)),
  ).sort();

  return {
    level: levelName,
    counts: {
      danglingCaptures: captures.length,
      uniqueMatch: uniqueMatches.length,
      multipleMatch: multipleMatches.length,
      noMatch: noMatch.length,
      explainedOrphanTraces: explainedOrphanTraceIds.length,
    },
    uniqueMatches,
    multipleMatches,
    noMatchCaptureIds: noMatch,
    explainedOrphanTraceIds,
  };
}

/**
 * Backref strategy: each orphan trace points back at its capture via `trace.captureId`.
 * The repair candidate for a dangling capture is the orphan trace whose
 * `captureId === capture.id`, provided taskId/appId still agree.
 *
 * Returns a level object with the same shape as `evaluateMatchLevel` so the
 * repair script can consume either kind of report uniformly.
 *
 * @param {CaptureRow[]} captures
 * @param {TraceRow[]} orphanTraces
 */
function evaluateBackrefStrategy(captures, orphanTraces) {
  /** @type {Map<string, TraceRow[]>} */
  const tracesByCaptureId = new Map();
  for (const t of orphanTraces) {
    if (!t.captureId) continue;
    const bucket = tracesByCaptureId.get(t.captureId);
    if (bucket) bucket.push(t);
    else tracesByCaptureId.set(t.captureId, [t]);
  }

  const uniqueMatches = [];
  const multipleMatches = [];
  const noMatch = [];
  const sanityCheckFailed = [];

  for (const capture of captures) {
    const candidates = tracesByCaptureId.get(capture.id) ?? [];
    if (candidates.length === 0) {
      noMatch.push(capture.id);
      continue;
    }
    if (candidates.length > 1) {
      multipleMatches.push({
        captureId: capture.id,
        currentTraceId: capture.traceId,
        candidateTraceIds: candidates.map((c) => c.id),
      });
      continue;
    }
    const trace = candidates[0];
    const taskMatches = trace.taskId === capture.taskId;
    const appMatches = trace.appId === capture.appId;
    if (!taskMatches || !appMatches) {
      sanityCheckFailed.push({
        captureId: capture.id,
        currentTraceId: capture.traceId,
        suggestedTraceId: trace.id,
        taskMatches,
        appMatches,
        capture: {
          taskId: capture.taskId,
          appId: capture.appId,
          userId: capture.userId,
        },
        trace: {
          taskId: trace.taskId,
          appId: trace.appId,
          userId: trace.userId,
        },
      });
      continue;
    }
    uniqueMatches.push({
      captureId: capture.id,
      currentTraceId: capture.traceId,
      suggestedTraceId: trace.id,
      capture: {
        taskId: capture.taskId,
        appId: capture.appId,
        userId: capture.userId,
      },
    });
  }

  const explainedOrphanTraceIds = Array.from(
    new Set(uniqueMatches.map((m) => m.suggestedTraceId)),
  ).sort();

  return {
    level: "captureBackref",
    counts: {
      danglingCaptures: captures.length,
      uniqueMatch: uniqueMatches.length,
      multipleMatch: multipleMatches.length,
      noMatch: noMatch.length,
      sanityCheckFailed: sanityCheckFailed.length,
      explainedOrphanTraces: explainedOrphanTraceIds.length,
    },
    uniqueMatches,
    multipleMatches,
    noMatchCaptureIds: noMatch,
    sanityCheckFailed,
    explainedOrphanTraceIds,
  };
}

/**
 * Match-key composition helpers (return null if any required field is missing
 * so the entry simply won't index/match instead of false-matching on `"null"`).
 */
const captureKeyTaskAppUser = (c) =>
  c.taskId && c.taskId !== EMPTY_OBJECT_ID && c.appId && c.userId
    ? `${c.taskId}|${c.appId}|${c.userId}`
    : null;
const traceKeyTaskAppUser = (t) =>
  t.taskId && t.taskId !== EMPTY_OBJECT_ID && t.appId && t.userId
    ? `${t.taskId}|${t.appId}|${t.userId}`
    : null;

const captureKeyTaskApp = (c) =>
  c.taskId && c.taskId !== EMPTY_OBJECT_ID && c.appId
    ? `${c.taskId}|${c.appId}`
    : null;
const traceKeyTaskApp = (t) =>
  t.taskId && t.taskId !== EMPTY_OBJECT_ID && t.appId
    ? `${t.taskId}|${t.appId}`
    : null;

const captureKeyTask = (c) =>
  c.taskId && c.taskId !== EMPTY_OBJECT_ID ? c.taskId : null;
const traceKeyTask = (t) =>
  t.taskId && t.taskId !== EMPTY_OBJECT_ID ? t.taskId : null;

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      input: { type: "string", short: "i", default: DEFAULT_INPUT },
      output: { type: "string", short: "o" },
      strategy: { type: "string", short: "s", default: STRATEGIES.BACKREF },
      help: { type: "boolean", short: "h" },
    },
  });

  if (values.help) {
    console.error(
      `Usage: node prisma/scripts/match-disjoint-traces.mjs [options]

Options:
  -i, --input <path>      diff-trace-sets.mjs JSON output (default: ${DEFAULT_INPUT})
  -o, --output <path>     Also write the full report to this file
  -s, --strategy <name>   ${STRATEGIES.BACKREF} | ${STRATEGIES.TASK} | ${STRATEGIES.BOTH} (default: ${STRATEGIES.BACKREF})
  -h, --help              Show this message`,
    );
    process.exit(0);
  }

  if (!isStrategy(values.strategy)) {
    console.error(
      `Unknown --strategy "${values.strategy}". Use ${STRATEGIES.BACKREF}, ${STRATEGIES.TASK}, or ${STRATEGIES.BOTH}.`,
    );
    process.exit(1);
  }

  const inputPath = path.resolve(process.cwd(), values.input);
  const diff = await loadDiffFile(inputPath);

  const [danglingCaptures, orphanTraces] = await Promise.all([
    fetchDanglingCaptures(prisma, diff.platform, diff.onlyInCaptureFilter),
    fetchOrphanTraces(prisma, diff.onlyInAppFilter),
  ]);

  /** @type {ReturnType<typeof evaluateMatchLevel>[]} */
  const levels = [];

  if (
    values.strategy === STRATEGIES.BACKREF ||
    values.strategy === STRATEGIES.BOTH
  ) {
    levels.push(evaluateBackrefStrategy(danglingCaptures, orphanTraces));
  }

  if (
    values.strategy === STRATEGIES.TASK ||
    values.strategy === STRATEGIES.BOTH
  ) {
    const indexes = {
      taskAppUser: indexTracesBy(orphanTraces, traceKeyTaskAppUser),
      taskApp: indexTracesBy(orphanTraces, traceKeyTaskApp),
      task: indexTracesBy(orphanTraces, traceKeyTask),
    };
    levels.push(
      evaluateMatchLevel(
        "taskId+appId+userId",
        danglingCaptures,
        indexes.taskAppUser,
        captureKeyTaskAppUser,
      ),
      evaluateMatchLevel(
        "taskId+appId",
        danglingCaptures,
        indexes.taskApp,
        captureKeyTaskApp,
      ),
      evaluateMatchLevel(
        "taskId",
        danglingCaptures,
        indexes.task,
        captureKeyTask,
      ),
    );
  }

  const report = {
    input: inputPath,
    platform: diff.platform,
    strategy: values.strategy,
    inputs: {
      onlyInCaptureFilter: diff.onlyInCaptureFilter.length,
      onlyInAppFilter: diff.onlyInAppFilter.length,
      danglingCapturesFound: danglingCaptures.length,
      orphanTracesFound: orphanTraces.length,
      orphanTracesWithBackref: orphanTraces.filter((t) => t.captureId).length,
    },
    levels,
  };

  const json = JSON.stringify(report, null, 2);
  console.log(json);

  if (values.output) {
    const outputPath = path.resolve(process.cwd(), values.output);
    await writeFile(outputPath, `${json}\n`, "utf8");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
