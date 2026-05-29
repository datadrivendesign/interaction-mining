/**
 * audit-istaken.mjs — Reconcile CandidateTaskApp.isTaken against real usage.
 *
 * isTaken is a manual admin flag (Mark as Taken/Available) and drifts from
 * reality. This audit treats an app as objectively "taken" when it has at
 * least one Capture (any status) OR at least one Trace, then reports four
 * buckets:
 *
 *   consistent-taken      isTaken=true,  has capture/trace evidence   ✓
 *   consistent-available  isTaken=false, no evidence                  ✓
 *   under-marked          isTaken=false, HAS evidence   → should be true (risk: re-issued)
 *   over-marked           isTaken=true,  NO evidence     → review (maybe reserved/stale)
 *
 * Default is a read-only dry run. With --apply, ONLY under-marked apps are
 * flipped false→true (the safe direction); over-marked apps are never changed
 * automatically. Only the isTaken field is written — candidateTasks is untouched.
 *
 * Usage:
 *   dotenvx run --env-file=.env.local -- node prisma/scripts/task-curation/audit-istaken.mjs
 *   dotenvx run --env-file=.env.local -- node prisma/scripts/task-curation/audit-istaken.mjs --apply
 *
 * Options:
 *   --apply        Flip under-marked apps (false→true). Default: dry run.
 *   --out <path>   Report JSON path (default: <script-dir>/istaken-audit-report.json)
 *   -h, --help     Show this message
 *
 * DATABASE_URL must be set (same connection string as the app).
 */

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    apply: { type: "boolean", default: false },
    out: { type: "string" },
    help: { type: "boolean", short: "h" },
  },
  allowPositionals: false,
});

if (values.help) {
  console.log(`Usage: node prisma/scripts/task-curation/audit-istaken.mjs [options]

Options:
  --apply        Flip under-marked apps (isTaken false→true). Default: dry run.
  --out <path>   Report JSON path (default: <script-dir>/istaken-audit-report.json)
  -h, --help     Show this message`);
  process.exit(0);
}

const outputPath = path.resolve(
  process.cwd(),
  values.out ?? path.join(__dirname, "istaken-audit-report.json"),
);

async function main() {
  // 1. Every candidate task app + its app name (for a human-readable report).
  const ctas = await prisma.candidateTaskApp.findMany({
    include: { app: true },
  });

  // 2. Bulk-load evidence once, aggregate in memory (avoids N+1 per app).
  const [captures, traces] = await Promise.all([
    prisma.capture.findMany({ select: { appId: true, status: true } }),
    prisma.trace.findMany({ select: { appId: true } }),
  ]);

  const capByApp = new Map(); // appId -> { total, byStatus }
  for (const c of captures) {
    const e = capByApp.get(c.appId) ?? { total: 0, byStatus: {} };
    e.total += 1;
    e.byStatus[c.status] = (e.byStatus[c.status] ?? 0) + 1;
    capByApp.set(c.appId, e);
  }
  const traceByApp = new Map(); // appId -> count
  for (const t of traces) {
    traceByApp.set(t.appId, (traceByApp.get(t.appId) ?? 0) + 1);
  }

  const buckets = {
    consistentTaken: [],
    consistentAvailable: [],
    underMarked: [],
    overMarked: [],
  };

  for (const cta of ctas) {
    const cap = capByApp.get(cta.appId);
    const captureCount = cap?.total ?? 0;
    const traceCount = traceByApp.get(cta.appId) ?? 0;
    const shouldBeTaken = captureCount > 0 || traceCount > 0;

    const rec = {
      id: cta.id,
      appId: cta.appId,
      appName: cta.app?.metadata?.name ?? "(unknown)",
      isTaken: cta.isTaken,
      captureCount,
      traceCount,
      captureStatuses: cap?.byStatus ?? {},
    };

    if (cta.isTaken && shouldBeTaken) buckets.consistentTaken.push(rec);
    else if (!cta.isTaken && !shouldBeTaken) buckets.consistentAvailable.push(rec);
    else if (!cta.isTaken && shouldBeTaken) buckets.underMarked.push(rec);
    else buckets.overMarked.push(rec);
  }

  // ── Report ────────────────────────────────────────────────────────────────
  const total = ctas.length;
  console.log(`\nCandidateTaskApp audit — ${total} apps`);
  console.log(`  rule: taken ⇔ (capture count > 0) OR (trace count > 0)\n`);
  console.log(`  ✓ consistent (taken, has evidence)     : ${buckets.consistentTaken.length}`);
  console.log(`  ✓ consistent (available, no evidence)  : ${buckets.consistentAvailable.length}`);
  console.log(`  ⚠ UNDER-marked (false → should be true): ${buckets.underMarked.length}`);
  console.log(`  ⚠ OVER-marked  (true, no evidence)     : ${buckets.overMarked.length}`);

  const preview = (label, list) => {
    if (!list.length) return;
    console.log(`\n${label} (showing up to 15):`);
    for (const r of list.slice(0, 15)) {
      const ev = `captures=${r.captureCount}${
        Object.keys(r.captureStatuses).length
          ? ` [${Object.entries(r.captureStatuses).map(([s, n]) => `${s}:${n}`).join(", ")}]`
          : ""
      }, traces=${r.traceCount}`;
      console.log(`  • ${r.appName} (${r.appId})  ${ev}`);
    }
  };
  preview("UNDER-marked — would be flipped to isTaken=true", buckets.underMarked);
  preview("OVER-marked — flagged for manual review (NOT changed)", buckets.overMarked);

  const report = {
    generatedAt: new Date().toISOString(),
    rule: "taken if captureCount > 0 OR traceCount > 0",
    applied: values.apply,
    totals: {
      apps: total,
      consistentTaken: buckets.consistentTaken.length,
      consistentAvailable: buckets.consistentAvailable.length,
      underMarked: buckets.underMarked.length,
      overMarked: buckets.overMarked.length,
    },
    underMarked: buckets.underMarked,
    overMarked: buckets.overMarked,
  };
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`\nFull report → ${outputPath}`);

  // ── Apply (under-marked only) ───────────────────────────────────────────────
  if (!values.apply) {
    console.log(`\nDry run — no changes written. Re-run with --apply to flip ${buckets.underMarked.length} under-marked apps to isTaken=true.`);
    return;
  }
  if (buckets.underMarked.length === 0) {
    console.log(`\n--apply: nothing to fix; no under-marked apps.`);
    return;
  }
  const ids = buckets.underMarked.map((r) => r.id);
  const result = await prisma.candidateTaskApp.updateMany({
    where: { id: { in: ids } },
    data: { isTaken: true },
  });
  console.log(`\n--apply: flipped ${result.count} under-marked apps to isTaken=true (candidateTasks untouched).`);
  console.log(`Over-marked apps left unchanged: ${buckets.overMarked.length} (review manually).`);
}

main()
  .catch((error) => {
    console.error("isTaken audit failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
