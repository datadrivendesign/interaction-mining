/**
 * import-curated-tasks.mjs — Write curated tasks back into CandidateTaskApp.
 *
 * Reads a curated JSON array (output of curate_tasks.py / curate_db_apps.py,
 * after filtering) and updates each matching CandidateTaskApp's candidateTasks
 * to the curated `selected` task strings.
 *
 * IMPORTANT: only the candidateTasks field is written. isTaken is never
 * touched — reconciling isTaken is the job of audit-istaken.mjs.
 *
 * Matching: by appId (App._id), which is @unique on CandidateTaskApp. Entries
 * whose appId has no CandidateTaskApp are reported as unmatched and skipped.
 *
 * Curated entry shape (only these fields are used):
 *   { "appId": str, "appName": str, "selected": [ { "task": str, ... } ] }
 *
 * Usage:
 *   dotenvx run --env-file=.env.local -- node prisma/scripts/task-curation/import-curated-tasks.mjs --in <file>
 *   dotenvx run --env-file=.env.local -- node prisma/scripts/task-curation/import-curated-tasks.mjs --in <file> --apply
 *
 * Options:
 *   --in <path>    Curated JSON array to import (required).
 *   --apply        Write changes. Default: dry run (reports diffs only).
 *   --out <path>   Report JSON path (default: <script-dir>/import-curated-report.json)
 *   -h, --help     Show this message
 *
 * DATABASE_URL must be set (same connection string as the app).
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    in: { type: "string" },
    apply: { type: "boolean", default: false },
    out: { type: "string" },
    help: { type: "boolean", short: "h" },
  },
  allowPositionals: false,
});

if (values.help || !values.in) {
  console.log(`Usage: node prisma/scripts/task-curation/import-curated-tasks.mjs --in <file> [options]

Options:
  --in <path>    Curated JSON array to import (required).
  --apply        Write changes. Default: dry run.
  --out <path>   Report JSON path (default: <script-dir>/import-curated-report.json)
  -h, --help     Show this message`);
  process.exit(values.in ? 0 : 1);
}

const inputPath = path.resolve(process.cwd(), values.in);
const outputPath = path.resolve(
  process.cwd(),
  values.out ?? path.join(__dirname, "import-curated-report.json"),
);

// MongoDB ObjectId — 24 hex chars. Guards against malformed appIds blowing up
// the unique-where lookup.
const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

function tasksFromEntry(entry) {
  return (entry.selected ?? [])
    .map((s) => (typeof s === "string" ? s : s?.task))
    .filter((t) => typeof t === "string" && t.trim().length > 0);
}

function sameTasks(a, b) {
  return a.length === b.length && a.every((t, i) => t === b[i]);
}

async function main() {
  const raw = JSON.parse(await readFile(inputPath, "utf8"));
  const entries = Array.isArray(raw) ? raw : raw.records;
  if (!Array.isArray(entries)) {
    throw new Error("Input must be a JSON array (or an object with a records array).");
  }
  console.log(`Loaded ${entries.length} curated entries from ${inputPath}.`);

  // Preload existing CandidateTaskApp rows so we can diff and detect unmatched
  // appIds without a per-entry round trip.
  const existing = await prisma.candidateTaskApp.findMany({
    select: { id: true, appId: true, candidateTasks: true },
  });
  const byAppId = new Map(existing.map((c) => [c.appId, c]));

  const plan = { willUpdate: [], unchanged: [], unmatched: [], empty: [], invalidId: [] };

  for (const entry of entries) {
    const appId = entry.appId ?? entry.id;
    const appName = entry.appName ?? "(unknown)";
    if (!appId || !OBJECT_ID_RE.test(String(appId))) {
      plan.invalidId.push({ appId: appId ?? null, appName });
      continue;
    }
    const tasks = tasksFromEntry(entry);
    if (tasks.length === 0) {
      plan.empty.push({ appId, appName });
      continue;
    }
    const current = byAppId.get(String(appId));
    if (!current) {
      plan.unmatched.push({ appId, appName });
      continue;
    }
    if (sameTasks(current.candidateTasks, tasks)) {
      plan.unchanged.push({ appId, appName });
    } else {
      plan.willUpdate.push({
        id: current.id,
        appId: String(appId),
        appName,
        fromCount: current.candidateTasks.length,
        toCount: tasks.length,
        tasks,
      });
    }
  }

  // ── Report ────────────────────────────────────────────────────────────────
  console.log(`\nImport plan — ${entries.length} entries`);
  console.log(`  will update      : ${plan.willUpdate.length}`);
  console.log(`  already current  : ${plan.unchanged.length}`);
  console.log(`  unmatched appId  : ${plan.unmatched.length}  (no CandidateTaskApp)`);
  console.log(`  empty selected   : ${plan.empty.length}  (skipped)`);
  console.log(`  invalid appId    : ${plan.invalidId.length}  (skipped)`);

  if (plan.willUpdate.length) {
    console.log(`\nWill update (showing up to 15):`);
    for (const u of plan.willUpdate.slice(0, 15)) {
      console.log(`  • ${u.appName} (${u.appId})  ${u.fromCount} → ${u.toCount} tasks`);
    }
  }
  if (plan.unmatched.length) {
    console.log(`\nUnmatched appIds (showing up to 10):`);
    for (const u of plan.unmatched.slice(0, 10)) console.log(`  • ${u.appName} (${u.appId})`);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    input: inputPath,
    applied: values.apply,
    totals: {
      entries: entries.length,
      willUpdate: plan.willUpdate.length,
      unchanged: plan.unchanged.length,
      unmatched: plan.unmatched.length,
      empty: plan.empty.length,
      invalidId: plan.invalidId.length,
    },
    willUpdate: plan.willUpdate,
    unmatched: plan.unmatched,
    empty: plan.empty,
    invalidId: plan.invalidId,
  };
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`\nFull report → ${outputPath}`);

  // ── Apply ───────────────────────────────────────────────────────────────────
  if (!values.apply) {
    console.log(`\nDry run — no changes written. Re-run with --apply to update ${plan.willUpdate.length} apps.`);
    return;
  }
  if (plan.willUpdate.length === 0) {
    console.log(`\n--apply: nothing to update.`);
    return;
  }

  let done = 0;
  for (const u of plan.willUpdate) {
    await prisma.candidateTaskApp.update({
      where: { appId: u.appId },
      data: { candidateTasks: u.tasks }, // isTaken intentionally omitted
    });
    done += 1;
    if (done % 200 === 0) console.log(`  …updated ${done}/${plan.willUpdate.length}`);
  }
  console.log(`\n--apply: updated candidateTasks for ${done} apps (isTaken untouched).`);
}

main()
  .catch((error) => {
    console.error("Curated-tasks import failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
