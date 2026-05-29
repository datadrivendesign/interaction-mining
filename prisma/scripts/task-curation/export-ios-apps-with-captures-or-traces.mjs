/**
 * Export all apps on a given platform that have at least one capture or trace record.
 *
 * The output is used by assign_tasks.py (--exclude flag) to avoid assigning tasks
 * to apps that already have capture/trace data in the database.
 *
 * Usage:
 *   node prisma/scripts/task-curation/export-ios-apps-with-captures-or-traces.mjs [options]
 *
 * Options:
 *   -p, --platform <os>     App OS filter: ios | android  (default: ios)
 *   -s, --source <mode>     What to include: capture | trace | both  (default: both)
 *   -f, --format <fmt>      Output shape: rich | lookup  (default: rich)
 *   --out <path>            Output JSON file (default: <script-dir>/<platform>-apps-with-<source>-<format>.json)
 *   -h, --help              Show this message
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_MODES = new Set(["capture", "trace", "both"]);
const OUTPUT_FORMATS = new Set(["rich", "lookup"]);

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    platform: { type: "string", short: "p", default: "ios" },
    source:   { type: "string", short: "s", default: "both" },
    format:   { type: "string", short: "f", default: "rich" },
    out:      { type: "string" },
    help:     { type: "boolean", short: "h" },
  },
  allowPositionals: false,
});

if (values.help) {
  console.log(`Usage: node prisma/scripts/task-curation/export-ios-apps-with-captures-or-traces.mjs [options]

Options:
  -p, --platform <os>   ios | android  (default: ios)
  -s, --source <mode>   capture | trace | both  (default: both)
  -f, --format <fmt>    rich | lookup  (default: rich)
  --out <path>          Output JSON file
  -h, --help            Show this message`);
  process.exit(0);
}

const platform = values.platform;
const source = values.source;
const format = values.format;

if (!SOURCE_MODES.has(source)) {
  console.error("Invalid source. Expected one of: capture, trace, both.");
  process.exit(1);
}

if (!OUTPUT_FORMATS.has(format)) {
  console.error("Invalid format. Expected one of: rich, lookup.");
  process.exit(1);
}

const shouldIncludeCaptures = source === "capture" || source === "both";
const shouldIncludeTraces = source === "trace" || source === "both";

const outputPath = path.resolve(
  process.cwd(),
  values.out ?? path.join(__dirname, `${platform}-apps-with-${source}-${format}.json`),
);

function getOrCreateAppEntry(appsById, app) {
  const existing = appsById.get(app.id);

  if (existing) {
    return existing;
  }

  const entry = {
    appId: app.id,
    os: app.os,
    packageName: app.packageName,
    category: app.category ?? null,
    metadata: app.metadata,
    captureCount: 0,
    traceCount: 0,
    captureIds: [],
    traceIds: [],
    captures: [],
    traces: [],
  };

  appsById.set(app.id, entry);
  return entry;
}

function toLookupEntry(app) {
  return {
    appId: app.appId,
    os: app.os,
    packageName: app.packageName,
    name: app.metadata?.name ?? null,
    company: app.metadata?.company ?? null,
    url: app.metadata?.url ?? null,
    captureCount: app.captureCount,
    traceCount: app.traceCount,
  };
}

async function main() {
  const iosApps = await prisma.app.findMany({
    where: {
      os: platform,
    },
  });

  const appIds = iosApps.map((app) => app.id);
  const appById = new Map(iosApps.map((app) => [app.id, app]));

  const [captures, traces] = await Promise.all([
    shouldIncludeCaptures
      ? prisma.capture.findMany({
          where: {
            appId: {
              in: appIds,
            },
          },
          select: {
            id: true,
            appId: true,
            status: true,
            taskId: true,
            traceId: true,
            userId: true,
          },
        })
      : Promise.resolve([]),
    shouldIncludeTraces
      ? prisma.trace.findMany({
          where: {
            appId: {
              in: appIds,
            },
          },
          select: {
            id: true,
            appId: true,
            captureId: true,
            taskId: true,
            userId: true,
            description: true,
            created: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const appsById = new Map();

  for (const capture of captures) {
    const app = appById.get(capture.appId);

    if (!app) {
      continue;
    }

    const entry = getOrCreateAppEntry(appsById, app);

    entry.captureCount += 1;
    entry.captureIds.push(capture.id);
    entry.captures.push({
      id: capture.id,
      status: capture.status,
      taskId: capture.taskId,
      traceId: capture.traceId,
      userId: capture.userId,
    });
  }

  for (const trace of traces) {
    const app = appById.get(trace.appId);

    if (!app) {
      continue;
    }

    const entry = getOrCreateAppEntry(appsById, app);

    entry.traceCount += 1;
    entry.traceIds.push(trace.id);
    entry.traces.push({
      id: trace.id,
      captureId: trace.captureId,
      taskId: trace.taskId,
      userId: trace.userId,
      description: trace.description,
      created: trace.created,
    });
  }

  const apps = Array.from(appsById.values()).sort((first, second) => {
    const firstName = first.metadata?.name ?? "";
    const secondName = second.metadata?.name ?? "";

    return firstName.localeCompare(secondName) || first.packageName.localeCompare(second.packageName);
  });

  const payloadApps = format === "lookup" ? apps.map(toLookupEntry) : apps;

  const payload = {
    platform,
    source,
    format,
    exportedAt: new Date().toISOString(),
    appCount: apps.length,
    captureCount: captures.length,
    traceCount: traces.length,
    apps: payloadApps,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(
    `Found ${apps.length} ${platform} apps with ${source} data (${format} format)`,
  );
  console.log(`- captures: ${captures.length}`);
  console.log(`- traces: ${traces.length}`);
  console.log(`Wrote ${outputPath}`);
}

main()
  .catch((error) => {
    console.error(
      `Failed to export ${platform} apps with ${source} data (${format} format).`,
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
