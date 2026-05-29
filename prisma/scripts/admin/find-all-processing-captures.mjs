/**
 * Find all PROCESSING captures that have no linked Trace record and write
 * their IDs to a JSON manifest file.
 *
 * The export script (export-to-capture-store.mjs) consumes this file via
 * --json-file and will further filter to captures that have a video and
 * some form of interaction history in S3.
 *
 * Usage:
 *   node prisma/scripts/admin/find-all-processing-captures.mjs [options]
 *
 * Options:
 *   --output <path>   Where to write the manifest (default: same dir as script)
 *   --dry-run         Print count without writing
 *   -h, --help        Show this message
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    output: { type: "string", short: "o" },
    "dry-run": { type: "boolean", default: false },
    help: { type: "boolean", short: "h" },
  },
});

if (values.help) {
  console.log(`Usage: node prisma/scripts/admin/find-all-processing-captures.mjs [options]

Options:
  --output <path>   Path to write the manifest JSON (default: find-all-processing-captures.json in script dir)
  --dry-run         Print capture count without writing the file
  -h, --help        Show this message`);
  process.exit(0);
}

const outputPath =
  values.output ?? path.join(__dirname, "find-all-processing-captures.json");
const dryRun = values["dry-run"];

const prisma = new PrismaClient();

async function main() {
  const captures = await prisma.capture.findMany({
    where: {
      status: "PROCESSING",
      OR: [{ traceId: null }, { traceId: { isSet: false } }],
    },
    select: { id: true },
    orderBy: { id: "asc" },
  });

  const captureIds = captures.map((c) => c.id);

  console.log(
    `Found ${captureIds.length} PROCESSING capture(s) with no linked Trace`,
  );

  if (dryRun) {
    console.log("(dry-run) No file written.");
    return;
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    status: "PROCESSING",
    captureCount: captureIds.length,
    captureIds,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Written to: ${outputPath}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
