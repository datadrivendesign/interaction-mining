/**
 * Filter CandidateTaskApp records: remove apps marked isTaken and apps in the Games category.
 *
 * Reads the JSON produced by export-candidate-task-apps.mjs and writes a filtered copy.
 *
 * Usage:
 *   node prisma/scripts/task-curation/filter-candidate-task-apps.mjs [options]
 *
 * Options:
 *   --in <path>    Input JSON file  (default: <script-dir>/candidate-task-apps-export.json)
 *   --out <path>   Output JSON file (default: <script-dir>/candidate-task-apps-filtered.json)
 *   -h, --help     Show this message
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    in: { type: "string" },
    out: { type: "string" },
    help: { type: "boolean", short: "h" },
  },
  allowPositionals: false,
});

if (values.help) {
  console.log(`Usage: node prisma/scripts/task-curation/filter-candidate-task-apps.mjs [options]

Options:
  --in <path>    Input JSON file  (default: <script-dir>/candidate-task-apps-export.json)
  --out <path>   Output JSON file (default: <script-dir>/candidate-task-apps-filtered.json)
  -h, --help     Show this message`);
  process.exit(0);
}

const inputPath = path.resolve(
  process.cwd(),
  values.in ?? path.join(__dirname, "candidate-task-apps-export.json"),
);

const outputPath = path.resolve(
  process.cwd(),
  values.out ?? path.join(__dirname, "candidate-task-apps-filtered.json"),
);

function normalizeRecords(parsedJson) {
  if (Array.isArray(parsedJson)) {
    return parsedJson;
  }

  if (Array.isArray(parsedJson.records)) {
    return parsedJson.records;
  }

  throw new Error(
    "Input JSON must be an array or an object with a records array.",
  );
}

function isGameApp(record) {
  const categoryName = record.app?.category?.name;
  const genre = record.app?.metadata?.genre;

  const categoryValues = [
    typeof categoryName === "string" ? categoryName : undefined,
    ...(Array.isArray(genre) ? genre : []),
  ].filter((value) => typeof value === "string");

  return categoryValues.some((value) => {
    const normalized = value.trim().toLowerCase();
    return normalized === "game" || normalized === "games";
  });
}

async function main() {
  const input = await readFile(inputPath, "utf8");
  const parsedJson = JSON.parse(input);
  const records = normalizeRecords(parsedJson);

  const filteredRecords = records.filter((record) => {
    return record.isTaken !== true && !isGameApp(record);
  });

  const removedTakenCount = records.filter(
    (record) => record.isTaken === true,
  ).length;
  const removedGamesCount = records.filter((record) =>
    isGameApp(record),
  ).length;
  const removedTotalCount = records.length - filteredRecords.length;

  const payload = {
    sourceFile: inputPath,
    filteredAt: new Date().toISOString(),
    inputRecordCount: records.length,
    outputRecordCount: filteredRecords.length,
    removedRecordCount: removedTotalCount,
    removedTakenCount,
    removedGamesCount,
    records: filteredRecords,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(
    `Read ${records.length} CandidateTaskApp records from ${inputPath}`,
  );
  console.log(`Removed ${removedTotalCount} records total`);
  console.log(`- isTaken=true: ${removedTakenCount}`);
  console.log(`- Games category/genre: ${removedGamesCount}`);
  console.log(`Wrote ${filteredRecords.length} records to ${outputPath}`);
}

main().catch((error) => {
  console.error("Failed to filter CandidateTaskApp records.");
  console.error(error);
  process.exitCode = 1;
});
