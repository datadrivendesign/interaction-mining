/**
 * Delete a trace and its screens, reverting the parent capture to REVIEWING.
 *
 * Usage:
 *   node prisma/scripts/admin/delete-trace.mjs --id <traceId>
 *   node prisma/scripts/admin/delete-trace.mjs --id <traceId> --dry-run
 *
 * Options:
 *   --id <traceId>  Trace ID to delete (required)
 *   --dry-run       Print what would be deleted without making any changes
 *
 * WARNING: This is destructive and irreversible. Use --dry-run first.
 */

import { parseArgs } from "node:util";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      id: { type: "string" },
      "dry-run": { type: "boolean", default: false },
    },
    allowPositionals: false,
  });

  const traceId = values.id;
  if (!traceId) {
    console.error("Error: --id <traceId> is required.");
    console.error(
      "Usage: node prisma/scripts/admin/delete-trace.mjs --id <traceId> [--dry-run]",
    );
    process.exit(1);
  }

  const dryRun = values["dry-run"];

  // Verify trace exists before proceeding
  const trace = await prisma.trace.findUnique({ where: { id: traceId } });
  if (!trace) {
    console.error(`Trace ${traceId} not found.`);
    process.exit(1);
  }

  const screenCount = await prisma.screen.count({ where: { traceId } });

  if (dryRun) {
    console.log(`[dry-run] would delete:`);
    console.log(`  ${screenCount} screen(s) for trace ${traceId}`);
    console.log(`  trace ${traceId}`);
    if (trace.captureId) {
      console.log(`  capture ${trace.captureId} → reverted to REVIEWING`);
    }
    return;
  }

  const screens = await prisma.screen.deleteMany({ where: { traceId } });
  console.log(`${screens.count} screen(s) deleted for trace ${traceId}`);

  await prisma.trace.delete({ where: { id: traceId } });
  console.log(`Trace ${traceId} deleted`);

  if (trace.captureId) {
    const capture = await prisma.capture.update({
      where: { id: trace.captureId },
      data: { status: "REVIEWING" },
    });
    console.log(`Capture ${capture.id} reverted to REVIEWING`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
