/**
 * Export captures from MongoDB + S3 into a local capture_store directory.
 *
 * Output layout per capture:
 *   <out>/<captureId>/recording.mp4            — video (downloaded from S3)
 *   <out>/<captureId>/interaction_history.json  — gestures/redactions/screens
 *   <out>/<captureId>/<captureId>.json          — app/task/user metadata
 *
 * Source priority for interaction_history:
 *   1. Latest S3 draft  (uploads/<captureId>/drafts/draft-*.json)
 *   2. original-metadata.json  (uploads/<captureId>/original-metadata.json)
 *   3. Existing MongoDB trace screens (for REVIEWING/APPROVED captures)
 *
 * Usage:
 *   node prisma/scripts/capture-store/export-to-capture-store.mjs [options]
 *
 * Options:
 *   --capture-ids <id,id,...>  Comma-separated capture IDs to export
 *   --task-ids <id,id,...>     Export all captures for these task IDs
 *   --out <dir>                Output directory (required)
 *   --dry-run                  Print plan without downloading anything
 *   -h, --help                 Show this message
 *
 * At least one of --capture-ids or --task-ids is required.
 */

import dotenv from "dotenv";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../.env.local") });

import { PrismaClient } from "@prisma/client";
import {
  S3Client,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { createWriteStream, mkdirSync, writeFileSync, existsSync, appendFileSync, readFileSync } from "fs";
import { pipeline } from "stream/promises";
import { parseArgs } from "node:util";

// ── logger ────────────────────────────────────────────────────────────────────

const LOG_DIR = resolve(__dirname, "logs");
const runTimestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const LOG_FILE = join(LOG_DIR, `export-${runTimestamp}.log`);

mkdirSync(LOG_DIR, { recursive: true });

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(msg);
  appendFileSync(LOG_FILE, line + "\n");
}

function logError(msg) {
  const line = `[${new Date().toISOString()}] ERROR: ${msg}`;
  console.error(msg);
  appendFileSync(LOG_FILE, line + "\n");
}

// ── clients ───────────────────────────────────────────────────────────────────

const prisma = new PrismaClient();

const s3 = new S3Client({
  region: process.env._AWS_REGION,
  forcePathStyle: process.env.USE_MINIO_STORE === "true",
  ...(process.env.USE_MINIO_STORE === "true" && {
    endpoint: process.env.MINIO_ENDPOINT,
  }),
  credentials: {
    accessKeyId: process.env._AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env._AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env._AWS_UPLOAD_BUCKET;

const DEFAULT_OUT = null; // --out is required; no default to avoid writing to unexpected paths

// ── S3 helpers ─────────────────────────────────────────────────────────────────

async function s3GetObject(key) {
  return s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
}

async function s3ListObjects(prefix) {
  const res = await s3.send(
    new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix })
  );
  return res.Contents ?? [];
}

async function downloadToFile(key, destPath) {
  const res = await s3GetObject(key);
  const ws = createWriteStream(destPath);
  await pipeline(res.Body, ws);
}

async function downloadJson(key) {
  try {
    const res = await s3GetObject(key);
    const chunks = [];
    for await (const chunk of res.Body) chunks.push(chunk);
    return JSON.parse(Buffer.concat(chunks).toString("utf-8"));
  } catch {
    return null;
  }
}

// ── helpers ───────────────────────────────────────────────────────────────────

/**
 * Extract captureIds and taskIds from the nested processing JSON produced by
 * find-processing-user-apps-not-in-traces.mjs.
 *
 * Newer exports use captureIds; older exports use taskIds. Both are supported.
 * Supported shapes:
 *   { captureIds: string[] }                                       — flat manifest
 *   { users: [{ apps: [{ captureIds?: string[], taskIds?: string[] }] }] }  — grouped
 */
function extractIdsFromJson(filePath) {
  let raw;
  try {
    raw = JSON.parse(readFileSync(filePath, "utf-8"));
  } catch (err) {
    logError(`Failed to read --json-file: ${err.message}`);
    process.exit(1);
  }
  const captureIds = [];
  const taskIds = [];
  // Flat manifest (find-all-processing-captures.mjs output)
  for (const id of raw.captureIds ?? []) {
    if (id) captureIds.push(id);
  }
  // Grouped manifest (find-processing-user-apps-not-in-traces.mjs output)
  for (const user of raw.users ?? []) {
    for (const app of user.apps ?? []) {
      for (const id of app.captureIds ?? []) {
        if (id) captureIds.push(id);
      }
      for (const id of app.taskIds ?? []) {
        if (id) taskIds.push(id);
      }
    }
  }
  const uniqueCaptures = [...new Set(captureIds)];
  const uniqueTasks = [...new Set(taskIds)];
  if (uniqueCaptures.length > 0)
    log(`Loaded ${uniqueCaptures.length} capture ID(s) from ${filePath}`);
  if (uniqueTasks.length > 0)
    log(`Loaded ${uniqueTasks.length} task ID(s) from ${filePath}`);
  return { captureIds: uniqueCaptures, taskIds: uniqueTasks };
}

/**
 * Normalize absolute-ms timestamps to relative seconds from first frame.
 */
function normalizeTimestamps(screens) {
  const ts = screens.map((s) => Number(s.timestamp));
  const minTs = Math.min(...ts);
  return ts.map((t) => Math.round(((t - minTs) / 1000) * 1000) / 1000);
}

/**
 * Pick the latest draft from a list of S3 objects under the drafts/ prefix.
 * Draft files are named draft-<timestamp>.json; higher timestamp = newer.
 */
function latestDraftKey(objects) {
  const drafts = objects.filter((o) => /draft-\d+\.json$/.test(o.Key));
  if (drafts.length === 0) return null;
  drafts.sort((a, b) => {
    const tsA = parseInt(a.Key.match(/draft-(\d+)\.json$/)?.[1] ?? "0");
    const tsB = parseInt(b.Key.match(/draft-(\d+)\.json$/)?.[1] ?? "0");
    return tsB - tsA; // descending
  });
  return drafts[0].Key;
}

// ── per-capture export ────────────────────────────────────────────────────────

async function exportCapture(capture, outDir, dryRun) {
  const { id: captureId } = capture;
  const captureDir = join(outDir, captureId);

  // ── resolve interaction_history source ─────────────────────────────────────
  // Priority: latest S3 draft > original-metadata.json > MongoDB trace screens

  let interactionHistory = null;
  let source = null;

  // 1. Try latest S3 draft
  const allFiles = await s3ListObjects(`uploads/${captureId}/`);
  const draftKey = latestDraftKey(
    allFiles.filter((o) => o.Key.includes("/drafts/"))
  );
  if (draftKey) {
    interactionHistory = await downloadJson(draftKey);
    if (interactionHistory) source = `draft (${draftKey.split("/").pop()})`;
  }

  // 2. Fall back to original-metadata.json
  if (!interactionHistory) {
    const origMeta = await downloadJson(`uploads/${captureId}/original-metadata.json`);
    if (origMeta?.screens) {
      // original-metadata uses absolute ms timestamps — normalize to relative seconds
      const relativeTimestamps = normalizeTimestamps(origMeta.screens);
      interactionHistory = {
        screens: origMeta.screens.map((s, i) => ({
          id: s.id,
          timestamp: relativeTimestamps[i],
        })),
        gestures: origMeta.gestures ?? {},
        redactions: origMeta.redactions ?? {},
        description: origMeta.description ?? "",
        ...(origMeta.iOSVersion ? { iOSVersion: origMeta.iOSVersion } : {}),
        ...(origMeta.iPhoneVersion ? { iPhoneVersion: origMeta.iPhoneVersion } : {}),
      };
      source = "original-metadata.json";
    }
  }

  // 3. Fall back to MongoDB trace screens
  if (!interactionHistory && capture.traceId) {
    const trace = await prisma.trace.findUnique({
      where: { id: capture.traceId },
      include: { screens: { orderBy: { created: "asc" } } },
    });
    if (trace?.screens?.length > 0) {
      const gesturesMap = {};
      const redactionsMap = {};
      for (const screen of trace.screens) {
        const g = screen.gesture ?? {};
        gesturesMap[screen.id] = {
          type: g.type ?? null,
          description: g.description ?? null,
          x: g.x ?? null,
          y: g.y ?? null,
          scrollDeltaX: g.scrollDeltaX ?? null,
          scrollDeltaY: g.scrollDeltaY ?? null,
        };
        redactionsMap[screen.id] = (screen.redactions ?? []).map((r, i) => ({
          id: `${screen.id}-r${i}`,
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
          annotation: r.annotation,
        }));
      }
      interactionHistory = {
        screens: trace.screens.map((s, i) => ({
          id: s.id,
          timestamp: i, // synthetic 1s intervals — no video timestamps on existing traces
        })),
        gestures: gesturesMap,
        redactions: redactionsMap,
        description: trace.description ?? "",
        ...(trace.iOSVersion ? { iOSVersion: trace.iOSVersion } : {}),
        ...(trace.iPhoneVersion ? { iPhoneVersion: trace.iPhoneVersion } : {}),
      };
      source = "MongoDB trace screens";
    }
  }

  if (!interactionHistory) {
    log(`  [skip] no draft or metadata found in S3 and no linked trace in MongoDB`);
    return false;
  }

  // ── validate video before touching the filesystem ──────────────────────────
  const videoPath = join(captureDir, "recording.mp4");
  const videoAlreadyDownloaded = existsSync(videoPath);
  const videoEntry = videoAlreadyDownloaded
    ? null
    : allFiles.find((f) => f.Key.endsWith(".mp4") && !f.Key.includes("/drafts/"));

  if (!videoAlreadyDownloaded && !videoEntry) {
    log(`  [skip] no video found in S3 under uploads/${captureId}/`);
    return false;
  }

  if (dryRun) {
    log(
      `  [dry-run] source=${source}, ${interactionHistory.screens.length} screens, ` +
        `video=${videoAlreadyDownloaded ? "already downloaded" : videoEntry.Key}, ` +
        `task="${capture.task?.description ?? "?"}"`
    );
    return true;
  }

  mkdirSync(captureDir, { recursive: true });

  // ── write interaction_history.json ─────────────────────────────────────────
  writeFileSync(
    join(captureDir, "interaction_history.json"),
    JSON.stringify(interactionHistory, null, 2)
  );
  log(`  source: ${source}`);

  // ── write <captureId>.json metadata ────────────────────────────────────────
  const captureMeta = {
    _id: { $oid: captureId },
    app: capture.app
      ? {
          packageName: capture.app.packageName,
          os: capture.app.os,
          metadata: {
            name: capture.app.metadata?.name ?? null,
            icon: capture.app.metadata?.icon ?? null,
          },
        }
      : null,
    task: capture.task ? { description: capture.task.description } : null,
    user: capture.user ? { name: capture.user.name } : null,
    status: capture.status,
  };
  writeFileSync(
    join(captureDir, `${captureId}.json`),
    JSON.stringify(captureMeta, null, 2)
  );

  // ── download recording.mp4 ─────────────────────────────────────────────────
  if (videoAlreadyDownloaded) {
    log(`  video already present, skipping download`);
  } else {
    log(`  downloading video: ${videoEntry.Key}`);
    await downloadToFile(videoEntry.Key, videoPath);
  }

  log(`  ✓ ${captureDir}`);
  return true;
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      "capture-ids": { type: "string" },
      "task-ids": { type: "string" },
      "json-file": { type: "string" },
      out: { type: "string" },
      "dry-run": { type: "boolean", default: false },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: false,
  });

  if (values.help) {
    console.log(`Usage: node prisma/scripts/export-to-capture-store.mjs [options]

Options:
  --capture-ids <id,id,...>  Capture IDs to export (comma-separated)
  --task-ids <id,id,...>     Export all captures for these task IDs
  --json-file <path>         JSON file with nested taskIds (users[].apps[].taskIds[])
  --out <dir>                Output directory (required)
  --dry-run                  Show plan without downloading
  -h, --help                 Show this message

At least one of --capture-ids, --task-ids, or --json-file is required.
Captures that already have a Trace record are automatically skipped.`);
    process.exit(0);
  }

  if (!values["capture-ids"] && !values["task-ids"] && !values["json-file"]) {
    logError("provide --capture-ids, --task-ids, or --json-file");
    process.exit(1);
  }

  if (!values.out) {
    logError("--out <dir> is required");
    process.exit(1);
  }


  const outDir = values.out;
  const dryRun = values["dry-run"];

  // Collect IDs from all input sources
  const explicitIds = values["capture-ids"]
    ? values["capture-ids"].split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const jsonIds = values["json-file"] ? extractIdsFromJson(values["json-file"]) : { captureIds: [], taskIds: [] };

  // Merge capture IDs from --capture-ids and captureIds in the JSON file
  const allExplicitIds = [...new Set([
    ...explicitIds,
    ...jsonIds.captureIds,
  ])];

  // Merge task IDs from --task-ids and taskIds in the JSON file (legacy support)
  const uniqueTaskIds = [...new Set([
    ...(values["task-ids"]
      ? values["task-ids"].split(",").map((s) => s.trim()).filter(Boolean)
      : []),
    ...jsonIds.taskIds,
  ])];

  let captures = [];

  if (allExplicitIds.length > 0) {
    const found = await prisma.capture.findMany({
      where: { id: { in: allExplicitIds } },
      include: { app: true, task: true, user: true },
    });
    captures.push(...found);
  }

  if (uniqueTaskIds.length > 0) {
    const found = await prisma.capture.findMany({
      where: { taskId: { in: uniqueTaskIds } },
      include: { app: true, task: true, user: true },
    });
    // Deduplicate against explicitly fetched captures
    const existingIds = new Set(captures.map((c) => c.id));
    captures.push(...found.filter((c) => !existingIds.has(c.id)));
  }

  // Skip captures that already have a finalized Trace record
  const withTrace = captures.filter((c) => c.traceId != null);
  captures = captures.filter((c) => c.traceId == null);

  log(`Found ${captures.length + withTrace.length} capture(s) total`);
  if (withTrace.length > 0) {
    log(`Skipping ${withTrace.length} capture(s) that already have a Trace record`);
  }
  log(`Exporting ${captures.length} capture(s)`);
  log(`Log file: ${LOG_FILE}`);
  if (!dryRun) mkdirSync(outDir, { recursive: true });

  let exported = 0;
  let skipped = 0;
  let errors = 0;

  for (const capture of captures) {
    log(`\nCapture ${capture.id} (${capture.status})`);
    try {
      const ok = await exportCapture(capture, outDir, dryRun);
      if (ok) exported++;
      else skipped++;
    } catch (err) {
      logError(`  ${err.message}`);
      errors++;
    }
  }

  log(`\nDone. ${exported} exported, ${skipped} skipped (no source/video), ${withTrace.length} skipped (already traced), ${errors} errors.`);
}

main()
  .catch((e) => {
    logError(e.message ?? String(e));
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
