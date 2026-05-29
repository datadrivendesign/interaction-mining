/**
 * Export all CandidateTaskApp records (with their linked App) to a JSON file.
 *
 * Usage:
 *   node prisma/scripts/task-curation/export-candidate-task-apps.mjs [options]
 *
 * Options:
 *   --out <path>   Output JSON file path (default: <script-dir>/candidate-task-apps-export.json)
 *   -h, --help     Show this message
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    out:  { type: "string" },
    help: { type: "boolean", short: "h" },
  },
  allowPositionals: false,
});

if (values.help) {
  console.log(`Usage: node prisma/scripts/task-curation/export-candidate-task-apps.mjs [options]

Options:
  --out <path>   Output JSON file (default: <script-dir>/candidate-task-apps-export.json)
  -h, --help     Show this message`);
  process.exit(0);
}

const outputPath = path.resolve(
  process.cwd(),
  values.out ?? path.join(__dirname, "candidate-task-apps-export.json"),
);

async function main() {
  const candidateTaskApps = await prisma.candidateTaskApp.findMany({
    include: {
      app: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  const payload = {
    exportedAt: new Date().toISOString(),
    recordCount: candidateTaskApps.length,
    records: candidateTaskApps,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(
    `Exported ${candidateTaskApps.length} CandidateTaskApp records to ${outputPath}`,
  );
}

main()
  .catch((error) => {
    console.error("Failed to export CandidateTaskApp records.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
