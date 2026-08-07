/**
 * Explore Capture Statistics based on status and user
 *
 * Usage:
 *   node prisma/scripts/explore-capture-stats.mjs basic-stats
 *   node prisma/scripts/explore-capture-stats.mjs approval-metrics
 *   node prisma/scripts/explore-capture-stats.mjs --operation basic-stats --platform ios
 */

import { parseArgs } from "node:util";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

const OPERATIONS = /** @type {const} */ ({
  BASIC_STATS: "basic-stats",
  APPROVAL_METRICS: "approval-metrics",
});

const captureStatus = {
  CREATED: "CREATED",
  PROCESSING: "PROCESSING",
  REVIEWING: "REVIEWING",
  APPROVED: "APPROVED",
  ARCHIVED: "ARCHIVED",
};

// Load user IDs from gitignored data file (see prisma/scripts/data/known-user-ids.json).
const userIdsFile = resolve(__dirname, "../data/known-user-ids.json");
const configuredExcludedUserIds = existsSync(userIdsFile)
  ? (JSON.parse(readFileSync(userIdsFile, "utf-8")).excludedUserIds ?? [])
  : [];

/**
 * Whether the CLI operation name is supported.
 * @param {unknown} value
 * @returns {value is (typeof OPERATIONS)[keyof typeof OPERATIONS]}
 */
function isOperation(value) {
  return (
    value === OPERATIONS.BASIC_STATS || value === OPERATIONS.APPROVAL_METRICS
  );
}

/**
 * Pretty-print a JSON-serializable payload to stdout (2-space indent).
 * @param {unknown} data
 */
function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

/** Write usage text to stderr. */
function printHelp() {
  console.error(`Usage: node prisma/scripts/explore-capture-stats.mjs <operation> [options]

Operations:
  ${OPERATIONS.BASIC_STATS}       Counts captures, traces, screens, apps (aggregate + by status)
  ${OPERATIONS.APPROVAL_METRICS}  Ratios and per-user approved vs processing counts

Options:
  -o, --operation <name>  ${OPERATIONS.BASIC_STATS} | ${OPERATIONS.APPROVAL_METRICS} (alternative to positional)
  -p, --platform <os>     App OS filter (default: ios)
  -e, --exclude-users     Exclude configured user IDs (from data/known-user-ids.json)
  -h, --help              Show this message

Examples:
  node prisma/scripts/explore-capture-stats.mjs ${OPERATIONS.BASIC_STATS}
  node prisma/scripts/explore-capture-stats.mjs -o ${OPERATIONS.APPROVAL_METRICS} -p ios -e`);
}

/**
 * Load captures for an app OS, optional status filter, excluding given user IDs.
 * @param {import("@prisma/client").PrismaClient} db
 * @param {{ platform: string; excludedUserIds: string[]; statuses?: string[] }} opts
 * @returns {Promise<import("@prisma/client").Capture[]>}
 */
async function fetchCaptures(db, opts) {
  const statuses = opts.statuses ?? [
    captureStatus.APPROVED,
    captureStatus.PROCESSING,
    captureStatus.REVIEWING,
  ];

  return db.capture.findMany({
    where: {
      app: { os: opts.platform },
      status: { in: statuses },
      userId: { notIn: opts.excludedUserIds },
    },
  });
}

/**
 * Split captures into approved, processing, and reviewing buckets (only these statuses are queried by default).
 * @param {import("@prisma/client").Capture[]} captures
 * @returns {{
 *   approved: import("@prisma/client").Capture[];
 *   processing: import("@prisma/client").Capture[];
 *   reviewing: import("@prisma/client").Capture[];
 * }}
 */
function groupCapturesByStatus(captures) {
  return {
    approved: captures.filter((c) => c.status === captureStatus.APPROVED),
    processing: captures.filter((c) => c.status === captureStatus.PROCESSING),
    reviewing: captures.filter((c) => c.status === captureStatus.REVIEWING),
  };
}

/**
 * Distinct app IDs referenced by the given captures.
 * @param {import("@prisma/client").Capture[]} captures
 * @returns {Set<string>}
 */
function getAppsInCaptures(captures) {
  return new Set(captures.map((c) => c.appId).flat());
}

/**
 * Trace IDs attached to captures (flattened; nulls removed).
 * @param {import("@prisma/client").Capture[]} captures
 * @returns {string[]}
 */
function getTracesFromCaptures(captures) {
  return captures
    .map((c) => c.traceId)
    .flat()
    .filter((t) => t !== null);
}

/**
 * Load traces with nested screens for stats aggregation.
 * @param {import("@prisma/client").PrismaClient} db
 * @param {string[]} traceIds
 * @returns {Promise<import("@prisma/client").Trace[]>}
 */
async function fetchTracesByIds(db, traceIds) {
  if (traceIds.length === 0) {
    return [];
  }
  return db.trace.findMany({
    where: { id: { in: traceIds } },
    include: {
      screens: true,
    },
  });
}

/**
 * Total screen rows across all traces (sum of `screens.length`).
 * @param {import("@prisma/client").Trace[]} traces
 * @returns {number}
 */
function getNumberOfScreensInTraces(traces) {
  return traces.reduce((acc, trace) => {
    acc += trace.screens.length || 0;
    return acc;
  }, 0);
}

/**
 * Aggregate volume stats for a capture set: counts captures, resolved traces, screens, and distinct apps.
 * @param {import("@prisma/client").PrismaClient} db
 * @param {import("@prisma/client").Capture[]} captures
 * @returns {Promise<{ captures: number; traces: number; screens: number; apps: number }>}
 */
async function compileCaptureStats(db, captures) {
  const capturesCount = captures.length;
  const tracesIds = getTracesFromCaptures(captures);
  const traces = await fetchTracesByIds(db, tracesIds);
  const tracesCount = traces.length;
  const screensCount = getNumberOfScreensInTraces(traces);
  const apps = getAppsInCaptures(captures);
  const appsCount = apps.size;
  return {
    captures: capturesCount,
    traces: tracesCount,
    screens: screensCount,
    apps: appsCount,
  };
}

/**
 * Same as {@link compileCaptureStats}, computed separately for each status bucket.
 * @param {import("@prisma/client").PrismaClient} db
 * @param {ReturnType<typeof groupCapturesByStatus>} byStatus
 * @returns {Promise<{
 *   approved: { captures: number; traces: number; screens: number; apps: number };
 *   processing: { captures: number; traces: number; screens: number; apps: number };
 *   reviewing: { captures: number; traces: number; screens: number; apps: number };
 * }>}
 */
async function compileCaptureStatsByStatus(db, byStatus) {
  const approved = await compileCaptureStats(db, byStatus.approved);
  const processing = await compileCaptureStats(db, byStatus.processing);
  const reviewing = await compileCaptureStats(db, byStatus.reviewing);
  return {
    approved,
    processing,
    reviewing,
  };
}

/**
 * Approval-style ratios: denominator excludes reviewing captures (matches prior script semantics).
 * @param {ReturnType<typeof groupCapturesByStatus>} groups
 * @returns {{
 *   approvedCount: number;
 *   processingCount: number;
 *   reviewingCount: number;
 *   totalCount: number;
 *   approvedRatio: number;
 *   processingRatio: number;
 *   approvedPercent: number;
 *   processingPercent: number;
 * }}
 */
function getApprovalMetrics(groups) {
  const approvedCount = groups.approved.length;
  const processingCount = groups.processing.length;
  const reviewingCount = groups.reviewing.length;
  const totalCount = approvedCount + processingCount + reviewingCount;
  const denominator = totalCount - reviewingCount;
  const approvedRatio = denominator > 0 ? approvedCount / denominator : 0;
  const processingRatio = denominator > 0 ? processingCount / denominator : 0;

  return {
    approvedCount,
    processingCount,
    reviewingCount,
    totalCount,
    approvedRatio,
    processingRatio,
    approvedPercent: approvedRatio * 100,
    processingPercent: processingRatio * 100,
  };
}

/**
 * Count captures per `userId` for the given list.
 * @param {import("@prisma/client").Capture[]} captures
 * @returns {Record<string, number>}
 */
function countCapturesByUserId(captures) {
  return captures.reduce((acc, capture) => {
    acc[capture.userId] = (acc[capture.userId] || 0) + 1;
    return acc;
  }, {});
}

/**
 * Union of all keys across user→count maps (e.g. approved and processing histograms).
 * @param {Record<string, number>[]} countMaps
 * @returns {string[]}
 */
function uniqueUserIds(...countMaps) {
  const ids = new Set();
  for (const map of countMaps) {
    for (const id of Object.keys(map)) {
      ids.add(id);
    }
  }
  return Array.from(ids);
}

/**
 * Load user rows for IDs appearing in per-user stats.
 * @param {import("@prisma/client").PrismaClient} db
 * @param {string[]} userIds
 * @returns {Promise<import("@prisma/client").User[]>}
 */
async function fetchUsersByIds(db, userIds) {
  if (userIds.length === 0) {
    return [];
  }
  return db.user.findMany({
    where: { id: { in: userIds } },
  });
}

/**
 * Human-readable label for JSON output and logs.
 * @param {boolean} excludeUsers
 * @returns {string}
 */
function formatGroupLabel(excludeUsers) {
  return excludeUsers ? "Excluded" : "All";
}

/**
 * Fetch captures and group by status using the same exclusion rules as the CLI defaults.
 * @param {import("@prisma/client").PrismaClient} db
 * @param {string} platform
 * @param {boolean} excludeUsers
 * @returns {Promise<{
 *   captures: import("@prisma/client").Capture[];
 *   byStatus: ReturnType<typeof groupCapturesByStatus>;
 *   excludedUserIds: string[];
 * }>}
 */
async function loadCapturesContext(db, platform, excludeUsers) {
  const excludedUserIds = excludeUsers ? configuredExcludedUserIds : [];
  const captures = await fetchCaptures(db, {
    platform,
    excludedUserIds,
  });
  const byStatus = groupCapturesByStatus(captures);
  return { captures, byStatus, excludedUserIds };
}

/**
 * `basic-stats` operation: print JSON with aggregate volumes and per-status volumes.
 * @param {import("@prisma/client").PrismaClient} db
 * @param {{ platform: string; label: string }} meta
 * @param {Awaited<ReturnType<typeof loadCapturesContext>>} ctx
 * @returns {Promise<void>}
 */
async function runBasicStats(db, meta, ctx) {
  const totals = await compileCaptureStats(db, ctx.captures);
  const byStatus = await compileCaptureStatsByStatus(db, ctx.byStatus);
  printJson({
    operation: OPERATIONS.BASIC_STATS,
    platform: meta.platform,
    label: meta.label,
    aggregate: totals,
    byStatus,
  });
}

/**
 * `approval-metrics` operation: print JSON with global ratios and per-user approved vs processing counts.
 * @param {import("@prisma/client").PrismaClient} db
 * @param {{ platform: string; label: string }} meta
 * @param {Awaited<ReturnType<typeof loadCapturesContext>>} ctx
 * @returns {Promise<void>}
 */
async function runApprovalMetrics(db, meta, ctx) {
  const metrics = getApprovalMetrics(ctx.byStatus);
  const approvedByUser = countCapturesByUserId(ctx.byStatus.approved);
  const processingByUser = countCapturesByUserId(ctx.byStatus.processing);
  const userIds = uniqueUserIds(approvedByUser, processingByUser);
  const users = await fetchUsersByIds(db, userIds);

  const userRows = users
    .map((user) => {
      const approved = approvedByUser[user.id] || 0;
      const processing = processingByUser[user.id] || 0;
      const total = approved + processing;
      const approvedPercent = total > 0 ? (approved / total) * 100 : 0;
      return {
        userId: user.id,
        email: user.email,
        name: user.name,
        approvedCaptures: approved,
        processingCaptures: processing,
        approvedPercent:
          Math.round((approvedPercent + Number.EPSILON) * 100) / 100,
      };
    })
    .sort((a, b) => {
      if (b.approvedPercent !== a.approvedPercent) {
        return b.approvedPercent - a.approvedPercent;
      }
      if (b.approvedCaptures !== a.approvedCaptures) {
        return b.approvedCaptures - a.approvedCaptures;
      }
      return (a.email ?? a.userId).localeCompare(b.email ?? b.userId);
    });

  printJson({
    operation: OPERATIONS.APPROVAL_METRICS,
    platform: meta.platform,
    label: meta.label,
    metrics,
    users: userRows,
  });
}

/**
 * Parse CLI args, load data once, dispatch to the selected operation.
 * @returns {Promise<void>}
 */
async function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      operation: { type: "string", short: "o" },
      platform: { type: "string", short: "p", default: "ios" },
      excludeUsers: { type: "boolean", short: "e", default: false },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  });

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  const operation = values.operation ?? positionals[0];
  if (!isOperation(operation)) {
    printHelp();
    process.exit(1);
  }

  const platform = values.platform;
  const excludeUsers = values.excludeUsers;
  const label = formatGroupLabel(excludeUsers);

  const ctx = await loadCapturesContext(prisma, platform, excludeUsers);

  const meta = { platform, label };
  if (operation === OPERATIONS.BASIC_STATS) {
    await runBasicStats(prisma, meta, ctx);
  } else {
    await runApprovalMetrics(prisma, meta, ctx);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
