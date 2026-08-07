/**
 * Repair captures whose `traceId` is dangling, using the unique matches from
 * match-disjoint-traces.mjs. Defaults to dry-run.
 *
 * Workflow:
 *   1. Read the match report (default: prisma/scripts/match-report.json).
 *   2. Pick a level (default: `taskId+appId`) and use its `uniqueMatches`.
 *   3. For each suggested fix, re-validate against the live DB:
 *        - capture still exists
 *        - capture.traceId still equals `currentTraceId` from the report
 *        - capture.taskId/appId still match
 *        - suggestedTraceId still resolves to a Trace
 *        - trace.taskId equals capture.taskId, trace.appId equals capture.appId
 *   4. Print a JSON plan: { willUpdate, willSkip }.
 *   5. If --apply is passed, perform the updates and report results.
 *
 * Usage:
 *   # safe by default — prints the plan only
 *   node prisma/scripts/repair-disjoint-traces.mjs
 *
 *   # explicit options
 *   node prisma/scripts/repair-disjoint-traces.mjs \
 *     -i prisma/scripts/match-report.json \
 *     -l taskId+appId \
 *     -o prisma/scripts/repair-plan.json
 *
 *   # actually write the updates
 *   node prisma/scripts/repair-disjoint-traces.mjs --apply
 */

import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_INPUT = "prisma/scripts/trace-repair/match-report.json";
// match-disjoint-traces.mjs `--strategy backref` writes this level.
// Use "taskId+appId" if you re-ran with `--strategy task`.
const DEFAULT_LEVEL = "captureBackref";

/** @typedef {{
 *    captureId: string;
 *    currentTraceId: string;
 *    suggestedTraceId: string;
 *    capture: { taskId: string; appId: string; userId: string | null };
 *  }} UniqueMatch
 */

/**
 * Read and validate the match report file.
 * @param {string} filePath
 * @returns {Promise<{
 *   levels: Array<{
 *     level: string;
 *     uniqueMatches: UniqueMatch[];
 *   }>;
 * }>}
 */
async function loadMatchReport(filePath) {
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.levels)) {
    throw new Error(
      `Unexpected JSON shape at ${filePath}: missing "levels" array`,
    );
  }
  return parsed;
}

/**
 * Pull the uniqueMatches array from the requested level.
 * @param {Awaited<ReturnType<typeof loadMatchReport>>} report
 * @param {string} levelName
 * @returns {UniqueMatch[]}
 */
function selectMatches(report, levelName) {
  const level = report.levels.find((l) => l.level === levelName);
  if (!level) {
    const available = report.levels.map((l) => l.level).join(", ");
    throw new Error(
      `Level "${levelName}" not found in report. Available levels: ${available}`,
    );
  }
  return level.uniqueMatches;
}

/**
 * Fetch live capture rows (subset matching the suggested fixes) by ID.
 * @param {import("@prisma/client").PrismaClient} db
 * @param {string[]} captureIds
 */
async function fetchCapturesByIds(db, captureIds) {
  if (captureIds.length === 0) return new Map();
  const rows = await db.capture.findMany({
    where: { id: { in: captureIds } },
    select: {
      id: true,
      traceId: true,
      taskId: true,
      appId: true,
      status: true,
    },
  });
  return new Map(rows.map((r) => [r.id, r]));
}

/**
 * Fetch live trace rows by ID for the suggested replacement IDs.
 * @param {import("@prisma/client").PrismaClient} db
 * @param {string[]} traceIds
 */
async function fetchTracesByIds(db, traceIds) {
  if (traceIds.length === 0) return new Map();
  const rows = await db.trace.findMany({
    where: { id: { in: traceIds } },
    select: { id: true, taskId: true, appId: true },
  });
  return new Map(rows.map((r) => [r.id, r]));
}

/**
 * Validate one match against live DB rows. Returns either a `willUpdate` plan
 * row or a `willSkip` row with a reason code.
 * @param {UniqueMatch} match
 * @param {Map<string, { id: string; traceId: string | null; taskId: string; appId: string; status: string }>} captureMap
 * @param {Map<string, { id: string; taskId: string; appId: string }>} traceMap
 */
function validateMatch(match, captureMap, traceMap) {
  const capture = captureMap.get(match.captureId);
  if (!capture) {
    return { kind: "skip", reason: "captureMissing", match };
  }
  if (capture.traceId !== match.currentTraceId) {
    return {
      kind: "skip",
      reason: "captureTraceIdChanged",
      match,
      live: { captureTraceId: capture.traceId, captureStatus: capture.status },
    };
  }
  if (capture.taskId !== match.capture.taskId) {
    return {
      kind: "skip",
      reason: "captureTaskIdChanged",
      match,
      live: { captureTaskId: capture.taskId },
    };
  }
  if (capture.appId !== match.capture.appId) {
    return {
      kind: "skip",
      reason: "captureAppIdChanged",
      match,
      live: { captureAppId: capture.appId },
    };
  }

  const trace = traceMap.get(match.suggestedTraceId);
  if (!trace) {
    return { kind: "skip", reason: "suggestedTraceMissing", match };
  }
  if (trace.taskId !== capture.taskId) {
    return {
      kind: "skip",
      reason: "traceTaskIdMismatch",
      match,
      live: { traceTaskId: trace.taskId, captureTaskId: capture.taskId },
    };
  }
  if (trace.appId !== capture.appId) {
    return {
      kind: "skip",
      reason: "traceAppIdMismatch",
      match,
      live: { traceAppId: trace.appId, captureAppId: capture.appId },
    };
  }

  return {
    kind: "update",
    captureId: capture.id,
    currentTraceId: capture.traceId,
    newTraceId: trace.id,
    captureStatus: capture.status,
  };
}

/**
 * Apply the planned `willUpdate` changes one capture at a time so a single
 * failure doesn't abort the rest. Returns parallel arrays of successes/failures.
 * @param {import("@prisma/client").PrismaClient} db
 * @param {Array<{ captureId: string; currentTraceId: string | null; newTraceId: string }>} updates
 */
async function applyUpdates(db, updates) {
  const succeeded = [];
  const failed = [];
  for (const u of updates) {
    try {
      await db.capture.update({
        where: { id: u.captureId },
        data: { traceId: u.newTraceId },
      });
      succeeded.push(u);
    } catch (e) {
      failed.push({ ...u, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return { succeeded, failed };
}

/**
 * Group the skipped entries by reason code for a quick summary.
 * @param {Array<{ kind: "skip"; reason: string }>} skips
 */
function tallyReasons(skips) {
  /** @type {Record<string, number>} */
  const tally = {};
  for (const s of skips) {
    tally[s.reason] = (tally[s.reason] ?? 0) + 1;
  }
  return tally;
}

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      input: { type: "string", short: "i", default: DEFAULT_INPUT },
      level: { type: "string", short: "l", default: DEFAULT_LEVEL },
      output: { type: "string", short: "o" },
      apply: { type: "boolean", default: false },
      help: { type: "boolean", short: "h" },
    },
  });

  if (values.help) {
    console.error(
      `Usage: node prisma/scripts/repair-disjoint-traces.mjs [options]

Options:
  -i, --input <path>   match-disjoint-traces.mjs JSON output (default: ${DEFAULT_INPUT})
  -l, --level <name>   Match level to use (default: ${DEFAULT_LEVEL})
  -o, --output <path>  Also write the report to this file
      --apply          Perform updates. Without this flag, runs in dry-run mode.
  -h, --help           Show this message`,
    );
    process.exit(0);
  }

  const inputPath = path.resolve(process.cwd(), values.input);
  const report = await loadMatchReport(inputPath);
  const matches = selectMatches(report, values.level);

  const captureIds = matches.map((m) => m.captureId);
  const traceIds = matches.map((m) => m.suggestedTraceId);

  const [captureMap, traceMap] = await Promise.all([
    fetchCapturesByIds(prisma, captureIds),
    fetchTracesByIds(prisma, traceIds),
  ]);

  const validated = matches.map((m) => validateMatch(m, captureMap, traceMap));
  const willUpdate = validated.filter((v) => v.kind === "update");
  const willSkip = validated.filter((v) => v.kind === "skip");

  /** @type {{
   *   input: string;
   *   level: string;
   *   mode: "dry-run" | "apply";
   *   plan: { totalCandidates: number; willUpdate: number; willSkip: number; skipReasons: Record<string, number> };
   *   updates: typeof willUpdate;
   *   skips: typeof willSkip;
   *   results?: { succeededCount: number; failedCount: number; failed: Array<{ captureId: string; error: string }> };
   * }} */
  const out = {
    input: inputPath,
    level: values.level,
    mode: values.apply ? "apply" : "dry-run",
    plan: {
      totalCandidates: matches.length,
      willUpdate: willUpdate.length,
      willSkip: willSkip.length,
      skipReasons: tallyReasons(willSkip),
    },
    updates: willUpdate,
    skips: willSkip,
  };

  if (values.apply) {
    const { succeeded, failed } = await applyUpdates(prisma, willUpdate);
    out.results = {
      succeededCount: succeeded.length,
      failedCount: failed.length,
      failed: failed.map((f) => ({ captureId: f.captureId, error: f.error })),
    };
  }

  const json = JSON.stringify(out, null, 2);
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
