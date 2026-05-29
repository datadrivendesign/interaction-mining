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
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { PrismaClient } from "@prisma/client";

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    store:          { type: "string" },
    "capture-ids":  { type: "string" },
    "from-status":  { type: "string", default: "PROCESSING" },
    "to-status":    { type: "string" },
    "dry-run":      { type: "boolean", default: false },
    help:           { type: "boolean", short: "h" },
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

  const storeIds = values.store ? getCaptureIdsFromStore(values.store) : [];
  const explicitIds = values["capture-ids"]
    ? values["capture-ids"].split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const ids = [...new Set([...storeIds, ...explicitIds])];

  if (ids.length === 0) {
    console.log("No capture IDs found — nothing to update.");
    return;
  }

  console.log(`${ids.length} capture(s) candidate for ${fromStatus} → ${toStatus}`);

  if (dryRun) {
    // Show which ones would actually be affected (currently in fromStatus)
    const matching = await prisma.capture.findMany({
      where: { id: { in: ids }, status: fromStatus },
      select: { id: true },
    });
    console.log(`(dry-run) ${matching.length} capture(s) currently in ${fromStatus} would be updated.`);
    return;
  }

  const result = await prisma.capture.updateMany({
    where: { id: { in: ids }, status: fromStatus },
    data: { status: toStatus },
  });

  console.log(`Updated ${result.count} capture(s) from ${fromStatus} to ${toStatus}.`);
  if (result.count < ids.length) {
    console.log(`(${ids.length - result.count} skipped — already in a different status)`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
