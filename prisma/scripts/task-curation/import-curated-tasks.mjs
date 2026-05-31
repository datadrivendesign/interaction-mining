/**
 * import-curated-tasks.mjs — Write curated tasks back into CandidateTaskApp.
 *
 * Reads a curated JSON array (output of curate_tasks.py / curate_db_apps.py,
 * after filtering) and updates each matching CandidateTaskApp's tasks to the
 * curated `selected` tasks.
 *
 * IMPORTANT: only the tasks field is written. isTaken is never
 * touched — reconciling isTaken is the job of audit-istaken.mjs.
 *
 * Matching: by appId (App._id), which is @unique on CandidateTaskApp. Entries
 * whose appId has no CandidateTaskApp are reported as unmatched and skipped.
 *
 * Curated entry shape (only these fields are used):
 *   { "appId": str, "appName": str, "selected": [ { "task": str, "generated": bool } ] }
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
const VALID_STATUSES = new Set(["open", "started", "hidden"]);

function objectIdToString(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && typeof value.$oid === "string") {
    return value.$oid;
  }
  if (value && typeof value === "object" && typeof value.toHexString === "function") {
    return value.toHexString();
  }
  return null;
}

function tasksFromEntry(entry) {
  return (entry.selected ?? [])
    .map((selected) => {
      const description = typeof selected === "string" ? selected : selected?.task;
      if (typeof description !== "string" || description.trim().length === 0) {
        return null;
      }
      return {
        description: description.trim(),
        generated: typeof selected === "object" ? selected.generated === true : false,
        status: "open",
      };
    })
    .filter(Boolean);
}

function sameTasks(a, b) {
  return (
    a.length === b.length &&
    a.every(
      (task, i) =>
        task.description === b[i].description &&
        task.generated === b[i].generated &&
        task.status === b[i].status,
    )
  );
}

function normalizeExistingTask(task) {
  if (typeof task === "string") {
    return { description: task.trim(), generated: false, status: "open" };
  }
  if (!task || typeof task !== "object" || typeof task.description !== "string") {
    return null;
  }
  return {
    description: task.description.trim(),
    generated: task.generated === true,
    status: VALID_STATUSES.has(task.status) ? task.status : "open",
  };
}

function normalizeExistingTasks(row) {
  const source = Array.isArray(row.tasks)
    ? row.tasks
    : Array.isArray(row.candidateTasks)
      ? row.candidateTasks
      : [];
  return source.map(normalizeExistingTask).filter(Boolean);
}

function preserveCurrentStatuses(currentTasks, importedTasks) {
  const byKey = new Map(
    currentTasks.map((task) => [
      `${task.description}\u0000${task.generated ? "1" : "0"}`,
      task.status,
    ]),
  );
  return importedTasks.map((task) => ({
    ...task,
    status: byKey.get(`${task.description}\u0000${task.generated ? "1" : "0"}`) ?? "open",
  }));
}

async function main() {
  const raw = JSON.parse(await readFile(inputPath, "utf8"));
  const entries = Array.isArray(raw) ? raw : raw.records;
  if (!Array.isArray(entries)) {
    throw new Error("Input must be a JSON array (or an object with a records array).");
  }
  console.log(`Loaded ${entries.length} curated entries from ${inputPath}.`);

  // Raw read keeps the importer usable before/after the legacy candidateTasks
  // field is removed from Prisma's typed schema.
  const existing = await prisma.candidateTaskApp.findRaw({
    options: {
      projection: { _id: 1, app: 1, tasks: 1, candidateTasks: 1 },
    },
  });
  const byAppId = new Map(
    existing
      .map((row) => {
        const appId = objectIdToString(row.app);
        const id = objectIdToString(row._id);
        if (!appId || !id) return null;
        return [
          appId,
          {
            id,
            appId,
            tasks: normalizeExistingTasks(row),
          },
        ];
      })
      .filter(Boolean),
  );

  const plan = { willUpdate: [], unchanged: [], unmatched: [], empty: [], invalidId: [] };

  for (const entry of entries) {
    const appId = entry.appId ?? entry.id;
    const appName = entry.appName ?? "(unknown)";
    if (!appId || !OBJECT_ID_RE.test(String(appId))) {
      plan.invalidId.push({ appId: appId ?? null, appName });
      continue;
    }
    const importedTasks = tasksFromEntry(entry);
    if (importedTasks.length === 0) {
      plan.empty.push({ appId, appName });
      continue;
    }
    const current = byAppId.get(String(appId));
    if (!current) {
      plan.unmatched.push({ appId, appName });
      continue;
    }
    const tasks = preserveCurrentStatuses(current.tasks, importedTasks);
    if (sameTasks(current.tasks, tasks)) {
      plan.unchanged.push({ appId, appName });
    } else {
      plan.willUpdate.push({
        id: current.id,
        appId: String(appId),
        appName,
        fromCount: current.tasks.length,
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
      data: { tasks: u.tasks }, // isTaken intentionally omitted
    });
    done += 1;
    if (done % 200 === 0) console.log(`  …updated ${done}/${plan.willUpdate.length}`);
  }
  console.log(`\n--apply: updated tasks for ${done} apps (isTaken untouched).`);
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
