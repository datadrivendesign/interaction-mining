/**
 * Update the status of captures in MongoDB.
 *
 * Reads capture IDs from a capture_store directory or from --capture-ids.
 * Only updates captures that currently match --from-status (default: PROCESSING)
 * so already-reviewed captures are never accidentally rolled back.
 *
 * Usage:
 *   node prisma/scripts/admin/update-capture-status.mjs [options]
 *
 * Options:
 *   --store <dir>           Read capture IDs from this capture_store directory
 *   --capture-ids <id,...>  Explicit comma-separated capture IDs
 *   --from-status <status>  Only update captures in this status (default: PROCESSING)
 *   --to-status <status>    Target status (required)
 *   --dry-run               Print what would change without writing to MongoDB
 *   -h, --help              Show this message
 *
 * At least one of --store or --capture-ids is required.
 *
 * REVIEWED and APPROVED cannot be targets: the app's Approve buttons set them
 * together with other data (the pinned reviewer draft; the Trace and review
 * log), which a bare status change would leave missing. Moving a capture out
 * of REVIEWED also clears its pinned draft version.
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { PrismaClient } from "@prisma/client";

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    store: { type: "string" },
    "capture-ids": { type: "string" },
    "from-status": { type: "string", default: "PROCESSING" },
    "to-status": { type: "string" },
    "dry-run": { type: "boolean", default: false },
    help: { type: "boolean", short: "h" },
  },
});

if (values.help) {
  console.log(`Usage: node prisma/scripts/admin/update-capture-status.mjs [options]

Options:
  --store <dir>           Read capture IDs from capture_store directory
  --capture-ids <id,...>  Explicit comma-separated capture IDs
  --from-status <status>  Only update captures in this status (default: PROCESSING)
  --to-status <status>    Target status (required)
  --dry-run               Print what would change without writing to MongoDB
  -h, --help              Show this message`);
  process.exit(0);
}

if (!values.store && !values["capture-ids"]) {
  console.error("Error: --store or --capture-ids is required.");
  process.exit(1);
}

if (!values["to-status"]) {
  console.error("Error: --to-status is required.");
  process.exit(1);
}

// Keep in step with `enum CaptureStatus` in prisma/schema.prisma.
const CAPTURE_STATUSES = [
  "CREATED",
  "PROCESSING",
  "REVIEWING",
  "REVIEWED",
  "ARCHIVED",
  "APPROVED",
];
// Set only by the app, alongside data this script does not write.
const APP_ONLY_TARGETS = {
  REVIEWED:
    "a reviewer's Approve on the review page (it pins the draft version)",
  APPROVED:
    "the admin's Approve on the review page (it creates the Trace and the review log)",
};

for (const flag of ["from-status", "to-status"]) {
  if (!CAPTURE_STATUSES.includes(values[flag])) {
    console.error(
      `Error: --${flag} "${values[flag]}" is not a capture status. Use one of: ${CAPTURE_STATUSES.join(", ")}.`,
    );
    process.exit(1);
  }
}
if (APP_ONLY_TARGETS[values["to-status"]]) {
  console.error(
    `Error: captures move to ${values["to-status"]} only through ${APP_ONLY_TARGETS[values["to-status"]]}.`,
  );
  process.exit(1);
}
if (values["from-status"] === values["to-status"]) {
  console.error("Error: --from-status and --to-status are the same.");
  process.exit(1);
}

/** Cluster and database name, without credentials, to tell dev from prod. */
function describeDatabase(url) {
  try {
    const { hostname, pathname } = new URL(url);
    const cluster = hostname.split(".")[0];
    const database = pathname.replace(/^\//, "") || "(default)";
    return `${cluster} / ${database}`;
  } catch {
    return "(DATABASE_URL not set or unreadable)";
  }
}

function getCaptureIdsFromStore(storeDir) {
  if (!existsSync(storeDir)) return [];
  return readdirSync(storeDir).filter((name) => {
    const dir = join(storeDir, name);
    return (
      statSync(dir).isDirectory() &&
      existsSync(join(dir, "interaction_history.json"))
    );
  });
}

const prisma = new PrismaClient();

async function main() {
  const fromStatus = values["from-status"];
  const toStatus = values["to-status"];
  const dryRun = values["dry-run"];
  console.log(`Database: ${describeDatabase(process.env.DATABASE_URL)}`);

  const storeIds = values.store ? getCaptureIdsFromStore(values.store) : [];
  const explicitIds = values["capture-ids"]
    ? values["capture-ids"]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const ids = [...new Set([...storeIds, ...explicitIds])];

  if (ids.length === 0) {
    console.log("No capture IDs found — nothing to update.");
    return;
  }

  console.log(
    `${ids.length} capture(s) candidate for ${fromStatus} → ${toStatus}`,
  );

  if (dryRun) {
    // Show which ones would actually be affected (currently in fromStatus)
    const matching = await prisma.capture.findMany({
      where: { id: { in: ids }, status: fromStatus },
      select: { id: true },
    });
    console.log(
      `(dry-run) ${matching.length} capture(s) currently in ${fromStatus} would be updated.`,
    );
    return;
  }

  const result = await prisma.capture.updateMany({
    where: { id: { in: ids }, status: fromStatus },
    // A capture leaving REVIEWED is no longer waiting on that reviewer's
    // draft; the next reviewer Approve pins a new one.
    data:
      fromStatus === "REVIEWED"
        ? { status: toStatus, stagedDraftVersion: null }
        : { status: toStatus },
  });

  console.log(
    `Updated ${result.count} capture(s) from ${fromStatus} to ${toStatus}.`,
  );
  if (result.count < ids.length) {
    console.log(
      `(${ids.length - result.count} skipped — already in a different status)`,
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
