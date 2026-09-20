/**
 * Upload reliability baseline — read-only analysis for plans/bugs/long-haul-upload-reliability.md
 *
 * Two independent measures, either of which can run alone:
 *
 *   put-latency        Parse S3 server access logs and report PUT duration normalized by
 *                      object size. This is the ONLY metric comparable across the Phase 1B
 *                      boundary, because client-side measures (retries, stalls) do not exist
 *                      until Phase 1B creates them.
 *
 *   duplicate-uploads  Detect byte-identical videos re-uploaded to the same capture. This is
 *                      the signature of the confirmed post-PUT false-failure defect (§3.1):
 *                      S3 accepted the object, the client reported failure, the worker
 *                      uploaded the same file again. Needs no access logs, so it works today
 *                      and gives a "before" number for the §6.1 fix.
 *
 * Usage:
 *   AWS_PROFILE=<profile> UPLOAD_BUCKET=<bucket> \
 *     node prisma/scripts/analytics/upload-baseline.mjs duplicate-uploads
 *
 *   AWS_PROFILE=<profile> UPLOAD_BUCKET=<bucket> ACCESS_LOG_BUCKET=<log-bucket> \
 *     node prisma/scripts/analytics/upload-baseline.mjs put-latency --days 7
 *
 *   node prisma/scripts/analytics/upload-baseline.mjs all --bucket <bucket> --json
 *
 * Bucket names and the AWS profile are deliberately not defaulted — they identify a specific
 * account, so they come from flags or the environment. Set them in your shell, a local
 * .env.local, or pass --bucket / --log-bucket / --profile.
 *
 * Read-only: issues ListObjectsV2 and GetObject only. It never writes, deletes or configures.
 *
 * Privacy: S3 access logs record a remote IP but no requester identity for presigned PUTs.
 * This script reports population-level statistics by default and never geolocates. To compare
 * a specific cohort, pass --cohort-file with a JSON array of IP prefixes that the team has
 * volunteered, e.g. ["203.0.113.", "198.51.100."].
 */

import { parseArgs } from "node:util";
import { readFileSync, existsSync } from "node:fs";
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { gunzipSync } from "node:zlib";

const OPERATIONS = /** @type {const} */ ({
  PUT_LATENCY: "put-latency",
  DUPLICATE_UPLOADS: "duplicate-uploads",
  ALL: "all",
});

const VIDEO_EXTENSIONS = [".mp4", ".mov"];
const BYTES_PER_MB = 1_000_000;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    operation: { type: "string", short: "o" },
    profile: { type: "string" },
    region: { type: "string" },
    bucket: { type: "string" },
    "log-bucket": { type: "string" },
    "log-prefix": { type: "string" },
    "key-prefix": { type: "string", default: "uploads/" },
    days: { type: "string", default: "7" },
    "cohort-file": { type: "string" },
    json: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});

if (values.help) {
  console.log(
    readFileSync(new URL(import.meta.url))
      .toString()
      .split("*/")[0],
  );
  process.exit(0);
}

// The AWS SDK's default credential chain reads AWS_PROFILE; --profile is a convenience alias.
if (values.profile) process.env.AWS_PROFILE = values.profile;

const operation = values.operation ?? positionals[0] ?? OPERATIONS.ALL;
if (!Object.values(OPERATIONS).includes(operation)) {
  console.error(
    `Unknown operation "${operation}". Expected one of: ${Object.values(OPERATIONS).join(", ")}`,
  );
  process.exit(1);
}

// Account-specific settings come from flags or the environment, never from a default in source.
const region = values.region ?? process.env._AWS_REGION ?? "us-east-2";
const bucket =
  values.bucket ?? process.env.UPLOAD_BUCKET ?? process.env._AWS_UPLOAD_BUCKET;
const logBucket = values["log-bucket"] ?? process.env.ACCESS_LOG_BUCKET;
const logPrefix = values["log-prefix"] ?? (bucket ? `${bucket}/` : undefined);

/**
 * Abort with a usage hint when a required account-specific setting is missing.
 * @param {string} flag
 * @param {string} envVar
 * @returns {never}
 */
function missing(flag, envVar) {
  console.error(
    `Missing bucket name. Pass --${flag} <name> or set ${envVar} in the environment.\n` +
      "These are not defaulted in source because they identify a specific AWS account.",
  );
  process.exit(1);
}

if (!bucket) missing("bucket", "UPLOAD_BUCKET");
if (operation !== OPERATIONS.DUPLICATE_UPLOADS && !logBucket) {
  missing("log-bucket", "ACCESS_LOG_BUCKET");
}

const s3 = new S3Client({ region });

/**
 * Percentile of a numeric array using nearest-rank.
 * @param {number[]} sorted Ascending-sorted values.
 * @param {number} p Percentile in [0, 1].
 * @returns {number}
 */
function percentile(sorted, p) {
  if (sorted.length === 0) return Number.NaN;
  const rank = Math.max(1, Math.ceil(p * sorted.length));
  return sorted[rank - 1];
}

/**
 * Summary statistics for a numeric series.
 * @param {number[]} values
 * @returns {{n: number, p50: number, p75: number, p90: number, p95: number, p99: number, max: number}}
 */
function describe(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    n: sorted.length,
    p50: percentile(sorted, 0.5),
    p75: percentile(sorted, 0.75),
    p90: percentile(sorted, 0.9),
    p95: percentile(sorted, 0.95),
    p99: percentile(sorted, 0.99),
    max: sorted.at(-1) ?? Number.NaN,
  };
}

/**
 * List every object under a prefix, following continuation tokens.
 * @param {string} bucket
 * @param {string} prefix
 * @param {(count: number) => void} [onProgress]
 * @returns {Promise<Array<{Key: string, Size: number, LastModified: Date}>>}
 */
async function listAll(bucket, prefix, onProgress) {
  /** @type {Array<{Key: string, Size: number, LastModified: Date}>} */
  const out = [];
  let token;
  do {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: token,
      }),
    );
    for (const o of res.Contents ?? []) {
      out.push({ Key: o.Key, Size: o.Size, LastModified: o.LastModified });
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
    onProgress?.(out.length);
  } while (token);
  return out;
}

/**
 * Tokenize one S3 server access log line. Fields are space-separated, except that
 * bracketed timestamps and quoted strings are single tokens.
 * @param {string} line
 * @returns {string[]}
 */
function tokenizeLogLine(line) {
  /** @type {string[]} */
  const tokens = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === " ") {
      i += 1;
      continue;
    }
    let closer = null;
    if (line[i] === "[") closer = "]";
    else if (line[i] === '"') closer = '"';

    if (closer) {
      const end = line.indexOf(closer, i + 1);
      if (end === -1) {
        tokens.push(line.slice(i + 1));
        break;
      }
      tokens.push(line.slice(i + 1, end));
      i = end + 1;
    } else {
      const end = line.indexOf(" ", i);
      if (end === -1) {
        tokens.push(line.slice(i));
        break;
      }
      tokens.push(line.slice(i, end));
      i = end + 1;
    }
  }
  return tokens;
}

/** `-` is S3's null marker. */
const num = (v) => (v === "-" || v === undefined ? null : Number(v));

/**
 * Parse an access log line into the fields this analysis needs.
 * Field order: https://docs.aws.amazon.com/AmazonS3/latest/userguide/LogFormat.html
 * @param {string} line
 */
function parseLogLine(line) {
  const t = tokenizeLogLine(line);
  if (t.length < 15) return null;
  return {
    time: t[2],
    remoteIp: t[3],
    operation: t[6],
    key: t[7],
    httpStatus: t[9],
    errorCode: t[10],
    objectSize: num(t[12]),
    totalTimeMs: num(t[13]),
    turnAroundTimeMs: num(t[14]),
  };
}

/**
 * Analyze PUT latency from S3 server access logs.
 */
async function putLatency() {
  const days = Number(values.days);
  const cutoff = new Date(Date.now() - days * 86_400_000);

  const logObjects = (await listAll(logBucket, logPrefix)).filter(
    (o) => o.LastModified >= cutoff,
  );

  if (logObjects.length === 0) {
    console.log(
      `No access-log objects under s3://${logBucket}/${logPrefix} in the last ${days} day(s).\n` +
        "Server access logging delivers on a lag of a few hours. If it was enabled recently, wait and re-run.",
    );
    return null;
  }

  /** @type {string[] | null} */
  let cohortPrefixes = null;
  if (values["cohort-file"]) {
    if (!existsSync(values["cohort-file"])) {
      console.error(`Cohort file not found: ${values["cohort-file"]}`);
      process.exit(1);
    }
    cohortPrefixes = JSON.parse(readFileSync(values["cohort-file"], "utf-8"));
  }

  const records = [];
  let linesRead = 0;
  for (const [idx, obj] of logObjects.entries()) {
    if (!values.json && idx % 50 === 0) {
      process.stderr.write(`\rreading log ${idx + 1}/${logObjects.length}...`);
    }
    const res = await s3.send(
      new GetObjectCommand({ Bucket: logBucket, Key: obj.Key }),
    );
    let body = Buffer.from(await res.Body.transformToByteArray());
    if (obj.Key.endsWith(".gz")) body = gunzipSync(body);

    for (const line of body.toString("utf-8").split("\n")) {
      if (!line.trim()) continue;
      linesRead += 1;
      const rec = parseLogLine(line);
      if (!rec) continue;
      if (rec.operation !== "REST.PUT.OBJECT") continue;
      if (!rec.key?.startsWith(values["key-prefix"])) continue;
      records.push(rec);
    }
  }
  if (!values.json) process.stderr.write("\r\x1b[K");

  const ok = records.filter(
    (r) => r.httpStatus === "200" && r.objectSize > 0 && r.totalTimeMs > 0,
  );

  /** @param {typeof ok} rows */
  const metricsFor = (rows) => {
    const msPerMb = rows.map(
      (r) => r.totalTimeMs / (r.objectSize / BYTES_PER_MB),
    );
    const throughput = rows.map(
      (r) => r.objectSize / BYTES_PER_MB / (r.totalTimeMs / 1000),
    );
    return {
      count: rows.length,
      totalGb: rows.reduce((s, r) => s + r.objectSize, 0) / 1e9,
      objectSizeMb: describe(rows.map((r) => r.objectSize / BYTES_PER_MB)),
      totalTimeMs: describe(rows.map((r) => r.totalTimeMs)),
      turnAroundMs: describe(
        rows.map((r) => r.turnAroundTimeMs).filter((v) => v !== null),
      ),
      msPerMb: describe(msPerMb),
      throughputMbPerSec: describe(throughput),
    };
  };

  const statusMix = {};
  for (const r of records)
    statusMix[r.httpStatus] = (statusMix[r.httpStatus] ?? 0) + 1;
  const errorMix = {};
  for (const r of records)
    if (r.errorCode && r.errorCode !== "-")
      errorMix[r.errorCode] = (errorMix[r.errorCode] ?? 0) + 1;

  const result = {
    windowDays: days,
    logObjectsRead: logObjects.length,
    linesRead,
    putsUnderPrefix: records.length,
    successfulPuts: ok.length,
    statusMix,
    errorMix,
    population: metricsFor(ok),
  };

  if (cohortPrefixes) {
    const inCohort = ok.filter((r) =>
      cohortPrefixes.some((p) => r.remoteIp?.startsWith(p)),
    );
    const outCohort = ok.filter(
      (r) => !cohortPrefixes.some((p) => r.remoteIp?.startsWith(p)),
    );
    result.cohort = metricsFor(inCohort);
    result.nonCohort = metricsFor(outCohort);
  }

  return result;
}

/**
 * Detect byte-identical videos uploaded more than once to the same capture.
 */
async function duplicateUploads() {
  const objects = await listAll(
    bucket,
    values["key-prefix"],
    (n) => !values.json && process.stderr.write(`\rlisting ${n} objects...`),
  );
  if (!values.json) process.stderr.write("\r\x1b[K");

  const videos = objects.filter((o) =>
    VIDEO_EXTENSIONS.some((ext) => o.Key.toLowerCase().endsWith(ext)),
  );

  /** @type {Map<string, Array<{Key: string, Size: number}>>} */
  const byCapture = new Map();
  for (const v of videos) {
    // uploads/{captureId}/{name} — anything shallower or deeper is not a capture video.
    const captureId = v.Key.split("/")[1];
    if (!captureId) continue;
    if (!byCapture.has(captureId)) byCapture.set(captureId, []);
    byCapture.get(captureId).push(v);
  }

  const suspects = [];
  let duplicateObjects = 0;
  let duplicateBytes = 0;

  for (const [captureId, items] of byCapture) {
    if (items.length < 2) continue;
    /** @type {Map<number, number>} */
    const sizeCounts = new Map();
    for (const it of items)
      sizeCounts.set(it.Size, (sizeCounts.get(it.Size) ?? 0) + 1);

    const repeated = [...sizeCounts.entries()].filter(([, c]) => c > 1);
    if (repeated.length === 0) continue;

    let extraForCapture = 0;
    let bytesForCapture = 0;
    for (const [size, count] of repeated) {
      extraForCapture += count - 1; // one legitimate copy, the rest are re-uploads
      bytesForCapture += size * (count - 1);
    }
    duplicateObjects += extraForCapture;
    duplicateBytes += bytesForCapture;
    suspects.push({
      captureId,
      videos: items.length,
      redundantCopies: extraForCapture,
      wastedMb: +(bytesForCapture / BYTES_PER_MB).toFixed(1),
      sizes: [...sizeCounts.entries()]
        .filter(([, c]) => c > 1)
        .map(([size, c]) => `${size}×${c}`),
    });
  }

  suspects.sort((a, b) => b.wastedMb - a.wastedMb);

  return {
    bucket: bucket,
    videoObjects: videos.length,
    capturesWithVideo: byCapture.size,
    capturesWithMultipleVideos: [...byCapture.values()].filter(
      (v) => v.length > 1,
    ).length,
    capturesWithByteIdenticalRepeats: suspects.length,
    redundantObjects: duplicateObjects,
    // The headline baseline number for the §6.1 commit-boundary fix.
    redundantRatePct: +((100 * duplicateObjects) / videos.length).toFixed(3),
    wastedGb: +(duplicateBytes / 1e9).toFixed(2),
    topOffenders: suspects.slice(0, 15),
  };
}

/** Pretty-print a describe() row. */
const fmtRow = (label, d, unit = "") =>
  `  ${label.padEnd(22)} p50 ${d.p50.toFixed(1)}${unit}  p90 ${d.p90.toFixed(1)}${unit}  p95 ${d.p95.toFixed(1)}${unit}  p99 ${d.p99.toFixed(1)}${unit}  max ${d.max.toFixed(1)}${unit}`;

function printLatency(r) {
  if (!r) return;
  console.log(`\n=== PUT latency (${r.windowDays}d window) ===`);
  console.log(
    `  ${r.logObjectsRead} log objects, ${r.linesRead} lines, ${r.putsUnderPrefix} PUTs under "${values["key-prefix"]}", ${r.successfulPuts} successful`,
  );
  console.log(`  status mix: ${JSON.stringify(r.statusMix)}`);
  if (Object.keys(r.errorMix).length) {
    console.log(`  errors:     ${JSON.stringify(r.errorMix)}`);
  }
  const show = (title, m) => {
    console.log(
      `\n  -- ${title} (n=${m.count}, ${m.totalGb.toFixed(2)} GB) --`,
    );
    if (m.count === 0) {
      console.log(
        "    no successful PUTs in this window — logs deliver on a few hours' lag, so re-run later",
      );
      return;
    }
    console.log(fmtRow("object size", m.objectSizeMb, " MB"));
    console.log(fmtRow("total time", m.totalTimeMs, " ms"));
    console.log(fmtRow("turnaround", m.turnAroundMs, " ms"));
    console.log(fmtRow("NORMALIZED ms/MB", m.msPerMb, ""));
    console.log(fmtRow("throughput", m.throughputMbPerSec, " MB/s"));
  };
  show("population", r.population);
  if (r.cohort) {
    show("consented cohort", r.cohort);
    show("everyone else", r.nonCohort);
    if (r.cohort.count > 0 && r.nonCohort.count > 0) {
      const ratio = r.cohort.msPerMb.p95 / r.nonCohort.msPerMb.p95;
      console.log(
        `\n  cohort p95 ms/MB is ${ratio.toFixed(2)}× the rest (gate: 3×)`,
      );
    }
  }
}

function printDuplicates(r) {
  console.log(`\n=== Duplicate re-uploads in ${r.bucket} ===`);
  console.log(
    `  ${r.videoObjects} videos across ${r.capturesWithVideo} captures`,
  );
  console.log(
    `  ${r.capturesWithMultipleVideos} captures hold more than one video`,
  );
  console.log(
    `  ${r.capturesWithByteIdenticalRepeats} of those hold byte-identical repeats`,
  );
  console.log(
    `  ${r.redundantObjects} redundant objects = ${r.redundantRatePct}% of all videos, ${r.wastedGb} GB wasted`,
  );
  if (r.topOffenders.length) {
    console.log("\n  worst captures:");
    for (const o of r.topOffenders) {
      console.log(
        `    ${o.captureId}  ${o.redundantCopies} redundant  ${o.wastedMb} MB  [${o.sizes.join(", ")}]`,
      );
    }
  }
}

const out = {};
if (
  operation === OPERATIONS.DUPLICATE_UPLOADS ||
  operation === OPERATIONS.ALL
) {
  out.duplicateUploads = await duplicateUploads();
  if (!values.json) printDuplicates(out.duplicateUploads);
}
if (operation === OPERATIONS.PUT_LATENCY || operation === OPERATIONS.ALL) {
  out.putLatency = await putLatency();
  if (!values.json) printLatency(out.putLatency);
}
if (values.json) console.log(JSON.stringify(out, null, 2));
