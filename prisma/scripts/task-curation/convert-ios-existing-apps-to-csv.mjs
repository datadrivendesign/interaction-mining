/**
 * Merge the ios-apps-with-captures-or-traces export and isTaken CandidateTaskApp records
 * into a single CSV for tracking which apps are already claimed.
 *
 * Usage:
 *   node prisma/scripts/task-curation/convert-ios-existing-apps-to-csv.mjs [options]
 *
 * Options:
 *   --apps <path>        ios-apps-with-captures-or-traces JSON (default: <script-dir>/ios-apps-with-captures-or-traces.json)
 *   --candidates <path>  CandidateTaskApp export JSON (default: <script-dir>/candidate-task-apps-export.json)
 *   --out <path>         Output CSV file (default: <script-dir>/claimed-ios-apps.csv)
 *   -h, --help           Show this message
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
    apps:       { type: "string" },
    candidates: { type: "string" },
    out:        { type: "string" },
    help:       { type: "boolean", short: "h" },
  },
  allowPositionals: false,
});

if (values.help) {
  console.log(`Usage: node prisma/scripts/task-curation/convert-ios-existing-apps-to-csv.mjs [options]

Options:
  --apps <path>        ios-apps-with-captures-or-traces JSON
                       (default: <script-dir>/ios-apps-with-captures-or-traces.json)
  --candidates <path>  CandidateTaskApp export JSON
                       (default: <script-dir>/candidate-task-apps-export.json)
  --out <path>         Output CSV file (default: <script-dir>/claimed-ios-apps.csv)
  -h, --help           Show this message`);
  process.exit(0);
}

const inputPath = path.resolve(
  process.cwd(),
  values.apps ?? path.join(__dirname, "ios-apps-with-captures-or-traces.json"),
);

const candidateTaskAppsPath = path.resolve(
  process.cwd(),
  values.candidates ?? path.join(__dirname, "candidate-task-apps-export.json"),
);

const outputPath = path.resolve(
  process.cwd(),
  values.out ?? path.join(__dirname, "claimed-ios-apps.csv"),
);

const columns = [
  "appName",
  "packageName",
  "os",
  "company",
  "category",
  "genres",
  "appId",
  "appStoreUrl",
  "claimedSources",
];

function normalizeApps(parsedJson) {
  if (Array.isArray(parsedJson)) {
    return parsedJson;
  }

  if (Array.isArray(parsedJson.apps)) {
    return parsedJson.apps;
  }

  throw new Error("Input JSON must be an array or an object with an apps array.");
}

function normalizeCandidateTaskApps(parsedJson) {
  if (Array.isArray(parsedJson)) {
    return parsedJson;
  }

  if (Array.isArray(parsedJson.records)) {
    return parsedJson.records;
  }

  throw new Error("CandidateTaskApp JSON must be an array or an object with a records array.");
}

function csvEscape(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function joinList(value) {
  return Array.isArray(value) ? value.filter(Boolean).join(" | ") : "";
}

function appKey(row) {
  if (row.appId) {
    return `id:${row.appId}`;
  }

  return `package:${row.os}:${row.packageName}`;
}

function toRow(app, claimedSource) {
  return {
    appName: app.metadata?.name ?? "",
    packageName: app.packageName ?? "",
    os: app.os ?? "",
    company: app.metadata?.company ?? "",
    category: app.category?.name ?? "",
    genres: joinList(app.metadata?.genre),
    appId: app.appId ?? app.id ?? "",
    appStoreUrl: app.metadata?.url ?? "",
    claimedSources: claimedSource,
  };
}

function mergeRows(rows) {
  const rowsByKey = new Map();

  for (const row of rows) {
    const key = appKey(row);
    const existing = rowsByKey.get(key);

    if (!existing) {
      rowsByKey.set(key, row);
      continue;
    }

    const sources = new Set([
      ...existing.claimedSources.split(" | ").filter(Boolean),
      ...row.claimedSources.split(" | ").filter(Boolean),
    ]);

    existing.claimedSources = Array.from(sources).sort().join(" | ");
  }

  return Array.from(rowsByKey.values());
}

async function main() {
  const [existingAppsInput, candidateTaskAppsInput] = await Promise.all([
    readFile(inputPath, "utf8"),
    readFile(candidateTaskAppsPath, "utf8"),
  ]);

  const existingApps = normalizeApps(JSON.parse(existingAppsInput));
  const candidateTaskApps = normalizeCandidateTaskApps(JSON.parse(candidateTaskAppsInput));
  const takenCandidateApps = candidateTaskApps.filter((record) => record.isTaken === true);

  const rows = mergeRows([
    ...existingApps.map((app) => toRow(app, "has_capture_or_trace")),
    ...takenCandidateApps.map((record) => toRow(record.app ?? { id: record.appId }, "candidate_task_taken")),
  ])
    .sort((first, second) => {
      return (
        first.appName.localeCompare(second.appName) ||
        first.packageName.localeCompare(second.packageName)
      );
    });

  const csv = [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(",")),
  ].join("\n");

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${csv}\n`, "utf8");

  console.log(`Read ${existingApps.length} existing capture/trace apps from ${inputPath}`);
  console.log(`Read ${candidateTaskApps.length} CandidateTaskApp records from ${candidateTaskAppsPath}`);
  console.log(`Included ${takenCandidateApps.length} CandidateTaskApp records where isTaken=true`);
  console.log(`Wrote ${rows.length} CSV rows to ${outputPath}`);
}

main().catch((error) => {
  console.error("Failed to convert iOS existing apps JSON to CSV.");
  console.error(error);
  process.exitCode = 1;
});
