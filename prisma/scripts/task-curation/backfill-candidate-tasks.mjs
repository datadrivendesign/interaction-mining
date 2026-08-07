/**
 * backfill-candidate-tasks.mjs - Convert legacy candidateTasks strings to tasks objects.
 *
 * This backfills CandidateTaskApp rows that still have:
 *   candidateTasks: ["..."]
 *
 * into:
 *   tasks: [{ description, generated: false, status: "open" }]
 *
 * Backfilled "open" is candidate-list state only. It does not mean the task
 * was never historically copied into a Capture/Task, because legacy data did
 * not store a durable candidate-task origin link.
 *
 * Apps present in the curated import are skipped by default so
 * import-curated-tasks.mjs can write their true generated provenance.
 *
 * Usage:
 *   dotenvx run --env-file=.env.local -- node prisma/scripts/task-curation/backfill-candidate-tasks.mjs
 *   dotenvx run --env-file=.env.local -- node prisma/scripts/task-curation/backfill-candidate-tasks.mjs --apply
 *
 * Options:
 *   --curated <path>  Curated JSON whose appIds should be skipped
 *                     (default: scripts/curation-pipeline/candidate-task-apps-export-curated.json)
 *   --out <path>      Report JSON path (default: <script-dir>/backfill-candidate-tasks-report.json)
 *   --apply           Write changes. Default: dry run.
 *   -h, --help        Show this message
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
const repoRoot = path.resolve(__dirname, "../../..");

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    curated: { type: "string" },
    out: { type: "string" },
    apply: { type: "boolean", default: false },
    help: { type: "boolean", short: "h" },
  },
  allowPositionals: false,
});

if (values.help) {
  console.log(`Usage: node prisma/scripts/task-curation/backfill-candidate-tasks.mjs [options]

Options:
  --curated <path>  Curated JSON whose appIds should be skipped.
  --out <path>      Report JSON path.
  --apply           Write changes. Default: dry run.
  -h, --help        Show this message`);
  process.exit(0);
}

const curatedPath = path.resolve(
  process.cwd(),
  values.curated ??
    path.join(
      repoRoot,
      "scripts/curation-pipeline/candidate-task-apps-export-curated.json",
    ),
);
const outputPath = path.resolve(
  process.cwd(),
  values.out ?? path.join(__dirname, "backfill-candidate-tasks-report.json"),
);

function objectIdToString(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && typeof value.$oid === "string") {
    return value.$oid;
  }
  if (
    value &&
    typeof value === "object" &&
    typeof value.toHexString === "function"
  ) {
    return value.toHexString();
  }
  return null;
}

function toBackfilledTasks(candidateTasks) {
  return candidateTasks
    .filter((task) => typeof task === "string" && task.trim().length > 0)
    .map((task) => ({
      description: task.trim(),
      generated: false,
      status: "open",
    }));
}

async function loadCuratedAppIds() {
  const raw = JSON.parse(await readFile(curatedPath, "utf8"));
  const entries = Array.isArray(raw) ? raw : raw.records;
  if (!Array.isArray(entries)) {
    throw new Error(
      "Curated JSON must be an array or an object with a records array.",
    );
  }
  return new Set(
    entries
      .map((entry) => entry.appId ?? entry.id)
      .filter((appId) => typeof appId === "string" && appId.length > 0),
  );
}

async function main() {
  const curatedAppIds = await loadCuratedAppIds();
  console.log(
    `Loaded ${curatedAppIds.size} curated appIds from ${curatedPath}.`,
  );

  const rows = await prisma.candidateTaskApp.findRaw({
    options: {
      projection: { _id: 1, app: 1, tasks: 1, candidateTasks: 1 },
    },
  });

  const plan = {
    willBackfill: [],
    skippedCurated: [],
    alreadyBackfilled: [],
    emptyLegacyTasks: [],
    invalidId: [],
  };

  for (const row of rows) {
    const id = objectIdToString(row._id);
    const appId = objectIdToString(row.app);
    if (!id || !appId) {
      plan.invalidId.push({ id, appId });
      continue;
    }

    if (curatedAppIds.has(appId)) {
      plan.skippedCurated.push({ id, appId });
      continue;
    }

    if (Array.isArray(row.tasks) && row.tasks.length > 0) {
      plan.alreadyBackfilled.push({ id, appId });
      continue;
    }

    const legacyTasks = Array.isArray(row.candidateTasks)
      ? row.candidateTasks
      : [];
    const tasks = toBackfilledTasks(legacyTasks);
    if (tasks.length === 0) {
      plan.emptyLegacyTasks.push({ id, appId });
      continue;
    }

    plan.willBackfill.push({
      id,
      appId,
      fromCount: legacyTasks.length,
      toCount: tasks.length,
      tasks,
    });
  }

  console.log(`\nBackfill plan - ${rows.length} CandidateTaskApp rows`);
  console.log(`  will backfill      : ${plan.willBackfill.length}`);
  console.log(`  skipped curated    : ${plan.skippedCurated.length}`);
  console.log(`  already backfilled : ${plan.alreadyBackfilled.length}`);
  console.log(`  empty legacy tasks : ${plan.emptyLegacyTasks.length}`);
  console.log(`  invalid ids        : ${plan.invalidId.length}`);

  const report = {
    generatedAt: new Date().toISOString(),
    curated: curatedPath,
    applied: values.apply,
    totals: {
      rows: rows.length,
      willBackfill: plan.willBackfill.length,
      skippedCurated: plan.skippedCurated.length,
      alreadyBackfilled: plan.alreadyBackfilled.length,
      emptyLegacyTasks: plan.emptyLegacyTasks.length,
      invalidId: plan.invalidId.length,
    },
    willBackfill: plan.willBackfill,
    emptyLegacyTasks: plan.emptyLegacyTasks,
    invalidId: plan.invalidId,
  };
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`\nFull report -> ${outputPath}`);

  if (!values.apply) {
    console.log(
      `\nDry run - no changes written. Re-run with --apply to backfill ${plan.willBackfill.length} apps.`,
    );
    return;
  }

  let done = 0;
  for (const item of plan.willBackfill) {
    await prisma.$runCommandRaw({
      update: "candidate_task_apps",
      updates: [
        {
          q: { _id: { $oid: item.id } },
          u: {
            $set: { tasks: item.tasks },
            $unset: { candidateTasks: "" },
          },
          multi: false,
        },
      ],
    });
    done += 1;
    if (done % 200 === 0)
      console.log(`  updated ${done}/${plan.willBackfill.length}`);
  }

  console.log(`\n--apply: backfilled ${done} apps.`);
}

main()
  .catch((error) => {
    console.error("Candidate-task backfill failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
