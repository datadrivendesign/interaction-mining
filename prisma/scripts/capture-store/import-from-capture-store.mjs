/**
 * Import LLM corrections from the local capture_store back into the web app
 * as a new S3 draft, without touching MongoDB.
 *
 * The draft is written to uploads/<captureId>/drafts/draft-<timestamp>.json.
 * When an annotator opens /capture/<captureId>/edit, the app automatically
 * loads the latest draft and pre-fills the annotation form. They then review,
 * adjust if needed, and submit — which creates the final Trace record.
 *
 * Priority order for building the corrected draft:
 *   1. <analyzer-output>/<captureId>.diff.json  — structured diff from pipeline
 *      (applied on top of the exported interaction_history.json)
 *   2. <capture-store>/<captureId>/interaction_history.json  — used as-is
 *      (for manual edits or when no diff was produced)
 *
 * Usage:
 *   node prisma/scripts/capture-store/import-from-capture-store.mjs [options]
 *
 * Options:
 *   --store <dir>              Path to capture_store directory (required)
 *   --analyzer-output <dir>    Path to analyzer diff output directory (optional;
 *                              if omitted, interaction_history.json is used as-is)
 *   --capture-ids <id,id,...>  Only import these capture IDs
 *   --dry-run                  Print what would be uploaded without writing
 *   -h, --help                 Show this message
 */

import dotenv from "dotenv";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../../.env.local") });

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { parseArgs } from "node:util";

// ── clients ───────────────────────────────────────────────────────────────────

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

// No defaults — both paths are caller-supplied via CLI flags.

// ── helpers ───────────────────────────────────────────────────────────────────

function readJson(filePath) {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function getCaptureIds(storeDir) {
  if (!existsSync(storeDir)) return [];
  return readdirSync(storeDir).filter((name) => {
    const dir = join(storeDir, name);
    return (
      statSync(dir).isDirectory() &&
      existsSync(join(dir, "interaction_history.json"))
    );
  });
}

/**
 * Apply a TraceDiff to a DraftTraceFormData and return the corrected copy.
 */
function applyDiff(history, diff) {
  const corrected = JSON.parse(JSON.stringify(history)); // deep clone

  for (const change of diff.changes ?? []) {
    const gesture = corrected.gestures?.[change.screenId];
    if (!gesture) {
      console.log(
        `    [warn] screenId ${change.screenId} not in draft, skipping`,
      );
      continue;
    }
    for (const f of change.fields ?? []) {
      gesture[f.field] = f.after;
    }
  }

  if (diff.globalChanges?.description?.after) {
    corrected.description = diff.globalChanges.description.after;
  }

  return corrected;
}

async function uploadDraftToS3(captureId, draftData, dryRun) {
  const timestamp = Date.now();
  const key = `uploads/${captureId}/drafts/draft-${timestamp}.json`;
  const body = JSON.stringify(draftData, null, 2);

  if (dryRun) {
    const screenCount = draftData.screens?.length ?? 0;
    const gestureCount = Object.keys(draftData.gestures ?? {}).length;
    console.log(`  [dry-run] would upload → ${key}`);
    console.log(`    screens: ${screenCount}, gestures: ${gestureCount}`);
    console.log(`    description: "${draftData.description}"`);
    return;
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: "application/json",
    }),
  );
  console.log(`  ✓ uploaded → ${key}`);
}

// ── per-capture import ────────────────────────────────────────────────────────

async function importCapture(captureId, storeDir, analyzerOutput, dryRun) {
  const historyFile = join(storeDir, captureId, "interaction_history.json");
  const history = readJson(historyFile);
  if (!history) {
    console.log(`  [skip] no interaction_history.json found`);
    return false;
  }

  const diffFile = analyzerOutput
    ? join(analyzerOutput, `${captureId}.diff.json`)
    : null;
  const diff = diffFile ? readJson(diffFile) : null;

  let draftData;
  if (diff) {
    const changeCount =
      (diff.changes?.length ?? 0) + (diff.globalChanges?.description ? 1 : 0);
    console.log(
      `  applying diff (${changeCount} change(s), provider: ${diff.provider})`,
    );
    draftData = applyDiff(history, diff);
  } else {
    console.log(`  no diff found — using interaction_history as-is`);
    draftData = history;
  }

  await uploadDraftToS3(captureId, draftData, dryRun);
  return true;
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      store: { type: "string" },
      "analyzer-output": { type: "string" },
      "capture-ids": { type: "string" },
      "dry-run": { type: "boolean", default: false },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: false,
  });

  if (values.help) {
    console.log(`Usage: node prisma/scripts/capture-store/import-from-capture-store.mjs [options]

Options:
  --store <dir>              Path to capture_store directory (required)
  --analyzer-output <dir>    Path to analyzer diff output directory (optional)
  --capture-ids <id,id,...>  Import only these capture IDs (comma-separated)
  --dry-run                  Show what would be uploaded without writing
  -h, --help                 Show this message`);
    process.exit(0);
  }

  if (!values.store) {
    console.error("Error: --store <dir> is required.");
    process.exit(1);
  }

  const storeDir = values.store;
  const analyzerOutput = values["analyzer-output"] ?? null;
  const dryRun = values["dry-run"];

  const ids = values["capture-ids"]
    ? values["capture-ids"]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : getCaptureIds(storeDir);

  console.log(`Found ${ids.length} capture(s) to import`);

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const id of ids) {
    console.log(`\nCapture ${id}`);
    try {
      const ok = await importCapture(id, storeDir, analyzerOutput, dryRun);
      if (ok) processed++;
      else skipped++;
    } catch (err) {
      console.error(`  [error] ${err.message}`);
      errors++;
    }
  }

  console.log(
    `\nDone. ${processed} processed, ${skipped} skipped, ${errors} errors.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
