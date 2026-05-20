/**
 * Parse the output of diff-trace-sets.mjs and check the disjoint trace IDs for
 * malformed / broken records.
 *
 * Reads JSON of shape:
 *   {
 *     platform, summary,
 *     onlyInAppFilter: string[],     // traces that exist, but no filtered capture points at them
 *     onlyInCaptureFilter: string[]  // trace IDs referenced by captures; may or may not exist
 *   }
 *
 * For each trace ID it checks:
 *   - exists: trace document is present
 *   - missingFields: required fields are present (appId, description, taskId)
 *   - missingApp: appId points at a real App
 *   - missingTask: taskId points at a real Task (skipped for the placeholder empty ObjectId)
 *   - missingUser: userId (if set) points at a real User
 *   - missingCapture: captureId (if set) points at a real Capture
 *   - noScreens: the trace has zero screens
 *   - osMismatch (capture side only): trace.app.os differs from the expected platform
 *
 * Usage:
 *   node prisma/scripts/check-disjoint-traces.mjs
 *   node prisma/scripts/check-disjoint-traces.mjs -i prisma/scripts/trace-diff.json
 *   node prisma/scripts/check-disjoint-traces.mjs -i trace-diff.json -o malformed-traces.json
 */

import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_INPUT = "prisma/scripts/trace-repair/trace-diff.json";
const EMPTY_OBJECT_ID = "000000000000000000000000";

/**
 * Read and parse the diff-trace-sets.mjs output file.
 * @param {string} filePath
 * @returns {Promise<{
 *   platform: string;
 *   summary?: Record<string, number>;
 *   onlyInAppFilter: string[];
 *   onlyInCaptureFilter: string[];
 * }>}
 */
async function loadDiffFile(filePath) {
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.onlyInAppFilter) || !Array.isArray(parsed.onlyInCaptureFilter)) {
    throw new Error(
      `Unexpected JSON shape at ${filePath}: missing onlyInAppFilter / onlyInCaptureFilter arrays`,
    );
  }
  return parsed;
}

/**
 * Fetch traces with the related records we need to validate them.
 * @param {import("@prisma/client").PrismaClient} db
 * @param {string[]} ids
 */
async function fetchTracesWithRelations(db, ids) {
  if (ids.length === 0) return [];
  return db.trace.findMany({
    where: { id: { in: ids } },
    include: {
      app: { select: { id: true, os: true, packageName: true } },
      task: { select: { id: true } },
      user: { select: { id: true } },
      screens: { select: { id: true } },
    },
  });
}

/**
 * Return the subset of `ids` whose captures still exist, as a Set.
 * @param {import("@prisma/client").PrismaClient} db
 * @param {string[]} ids
 * @returns {Promise<Set<string>>}
 */
async function fetchExistingCaptureIdSet(db, ids) {
  if (ids.length === 0) return new Set();
  const rows = await db.capture.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
  return new Set(rows.map((r) => r.id));
}

/**
 * Check one trace document against the rules and return a list of issue codes.
 * @param {Awaited<ReturnType<typeof fetchTracesWithRelations>>[number]} trace
 * @param {{ expectedPlatform?: string; existingCaptureIds: Set<string> }} ctx
 * @returns {string[]}
 */
function diagnoseTrace(trace, ctx) {
  const issues = [];
  if (!trace.appId) issues.push("missingAppId");
  if (trace.description == null || trace.description === "") {
    issues.push("missingDescription");
  }
  if (!trace.app) issues.push("danglingAppRef");
  if (trace.taskId && trace.taskId !== EMPTY_OBJECT_ID && !trace.task) {
    issues.push("danglingTaskRef");
  }
  if (trace.userId && !trace.user) issues.push("danglingUserRef");
  if (trace.captureId && !ctx.existingCaptureIds.has(trace.captureId)) {
    issues.push("danglingCaptureRef");
  }
  if (!trace.screens || trace.screens.length === 0) {
    issues.push("noScreens");
  }
  if (
    ctx.expectedPlatform &&
    trace.app &&
    trace.app.os !== ctx.expectedPlatform
  ) {
    issues.push("osMismatch");
  }
  return issues;
}

/**
 * Inspect one set of trace IDs and return both found (with issues) and missing IDs.
 * @param {import("@prisma/client").PrismaClient} db
 * @param {string[]} ids
 * @param {{ expectedPlatform?: string }} [opts]
 */
async function inspectTraceSet(db, ids, opts = {}) {
  const traces = await fetchTracesWithRelations(db, ids);
  const foundIdSet = new Set(traces.map((t) => t.id));
  const missingIds = ids.filter((id) => !foundIdSet.has(id));

  const captureIds = traces
    .map((t) => t.captureId)
    .filter((id) => id !== null && id !== undefined);
  const existingCaptureIds = await fetchExistingCaptureIdSet(db, captureIds);

  const diagnosed = traces.map((trace) => ({
    id: trace.id,
    appId: trace.appId,
    appOs: trace.app ? trace.app.os : null,
    captureId: trace.captureId,
    taskId: trace.taskId,
    userId: trace.userId,
    screenCount: trace.screens.length,
    created: trace.created,
    issues: diagnoseTrace(trace, {
      expectedPlatform: opts.expectedPlatform,
      existingCaptureIds,
    }),
  }));

  return {
    checkedCount: ids.length,
    foundCount: traces.length,
    missingCount: missingIds.length,
    missingIds,
    malformed: diagnosed.filter((t) => t.issues.length > 0),
    clean: diagnosed.filter((t) => t.issues.length === 0).map((t) => t.id),
  };
}

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      input: { type: "string", short: "i", default: DEFAULT_INPUT },
      output: { type: "string", short: "o" },
      help: { type: "boolean", short: "h" },
    },
  });

  if (values.help) {
    console.error(
      `Usage: node prisma/scripts/check-disjoint-traces.mjs [options]

Options:
  -i, --input <path>   Path to diff-trace-sets.mjs JSON output (default: ${DEFAULT_INPUT})
  -o, --output <path>  Also write the full report to this file
  -h, --help           Show this message`,
    );
    process.exit(0);
  }

  const inputPath = path.resolve(process.cwd(), values.input);
  const diff = await loadDiffFile(inputPath);

  const [appFilterReport, captureFilterReport] = await Promise.all([
    inspectTraceSet(prisma, diff.onlyInAppFilter, {
      expectedPlatform: diff.platform,
    }),
    inspectTraceSet(prisma, diff.onlyInCaptureFilter, {
      expectedPlatform: diff.platform,
    }),
  ]);

  const report = {
    input: inputPath,
    platform: diff.platform,
    onlyInAppFilter: appFilterReport,
    onlyInCaptureFilter: captureFilterReport,
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
