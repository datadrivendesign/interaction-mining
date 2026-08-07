/**
 * Diff trace sets between two definitions:
 *   A) "app-filter" traces: every Trace whose parent App.os matches the platform.
 *      Mirrors getAppsTraceCount in src/lib/actions/app.ts (no capture / status / user filters).
 *   B) "capture-filter" traces: Trace IDs referenced by captures in
 *      {APPROVED, PROCESSING, REVIEWING} on the same platform, excluding configured user IDs.
 *      Mirrors explore-capture-stats.mjs.
 *
 * Prints:
 *   - summary counts (|A|, |B|, |A \ B|, |B \ A|)
 *   - onlyInAppFilter: trace IDs in A but not in B
 *   - onlyInCaptureFilter: trace IDs in B but not in A (dangling capture.traceId references)
 *
 * Usage:
 *   node prisma/scripts/diff-trace-sets.mjs            # platform=ios (default)
 *   node prisma/scripts/diff-trace-sets.mjs -p android
 */

import { parseArgs } from "node:util";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

const captureStatus = {
  APPROVED: "APPROVED",
  PROCESSING: "PROCESSING",
  REVIEWING: "REVIEWING",
};

// Load user IDs to exclude from gitignored data file (see prisma/scripts/data/known-user-ids.json).
const userIdsFile = resolve(__dirname, "../data/known-user-ids.json");
const excludedUserIds = existsSync(userIdsFile)
  ? (JSON.parse(readFileSync(userIdsFile, "utf-8")).excludedUserIds ?? [])
  : [];

/**
 * Trace IDs for every Trace whose parent App has the given OS.
 * Mirrors `getAppsTraceCount` (no status / user filtering).
 * @param {import("@prisma/client").PrismaClient} db
 * @param {string} platform
 * @returns {Promise<string[]>}
 */
async function fetchAppFilterTraceIds(db, platform) {
  const traces = await db.trace.findMany({
    where: { app: { os: platform } },
    select: { id: true },
  });
  return traces.map((t) => t.id);
}

/**
 * Non-null `capture.traceId` values for captures on the given platform
 * with status in {APPROVED, PROCESSING, REVIEWING}, excluding configured user IDs.
 * Mirrors `explore-capture-stats.mjs` fetchCaptures + getTracesFromCaptures.
 * @param {import("@prisma/client").PrismaClient} db
 * @param {string} platform
 * @returns {Promise<string[]>}
 */
async function fetchCaptureFilterTraceIds(db, platform) {
  const captures = await db.capture.findMany({
    where: {
      app: { os: platform },
      status: {
        in: [
          captureStatus.APPROVED,
          captureStatus.PROCESSING,
          captureStatus.REVIEWING,
        ],
      },
      userId: { notIn: excludedUserIds },
    },
    select: { traceId: true },
  });
  return captures
    .map((c) => c.traceId)
    .filter((id) => id !== null && id !== undefined);
}

/**
 * Set difference: items in `a` that are not in `b`.
 * @param {string[]} a
 * @param {string[]} b
 * @returns {string[]}
 */
function difference(a, b) {
  const bSet = new Set(b);
  return a.filter((x) => !bSet.has(x));
}

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      platform: { type: "string", short: "p", default: "ios" },
    },
  });
  const platform = values.platform;

  const [appFilterIds, captureFilterIds] = await Promise.all([
    fetchAppFilterTraceIds(prisma, platform),
    fetchCaptureFilterTraceIds(prisma, platform),
  ]);

  const onlyInAppFilter = difference(appFilterIds, captureFilterIds).sort();
  const onlyInCaptureFilter = difference(captureFilterIds, appFilterIds).sort();

  console.log(
    JSON.stringify(
      {
        platform,
        summary: {
          appFilterTraceCount: appFilterIds.length,
          captureFilterTraceCount: captureFilterIds.length,
          onlyInAppFilterCount: onlyInAppFilter.length,
          onlyInCaptureFilterCount: onlyInCaptureFilter.length,
        },
        onlyInAppFilter,
        onlyInCaptureFilter,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
