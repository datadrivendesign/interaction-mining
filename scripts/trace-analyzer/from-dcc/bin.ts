import fs from "node:fs";
import path from "node:path";
import { readTrace } from "./convert.ts";
import { FileCaptureStoreSink } from "./sink.ts";
import { validate } from "../validator.ts";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function usage(): void {
  console.error("Usage: tsx from-dcc/bin.ts <traceDir> --out <captureStore> [--ios <version>] [--iphone <model>]");
}

const args = process.argv.slice(2);

const traceDir = args[0] && !args[0].startsWith("--") ? path.resolve(args[0]) : null;
if (!traceDir) { usage(); process.exit(1); }

const outIdx = args.indexOf("--out");
const outDir = outIdx !== -1 ? path.resolve(args[outIdx + 1]) : null;
if (!outDir) { usage(); process.exit(1); }

const iosIdx = args.indexOf("--ios");
const iOSVersion = iosIdx !== -1 ? args[iosIdx + 1] : undefined;

const iphoneIdx = args.indexOf("--iphone");
const iPhoneVersion = iphoneIdx !== -1 ? args[iphoneIdx + 1] : undefined;

if (!fs.existsSync(traceDir)) {
  console.error(`Error: trace directory not found: ${traceDir}`);
  console.error("Run 'dcc run ...' first and pass the printed trace path.");
  process.exit(1);
}

const trace = await readTrace(traceDir);

if (!trace) {
  console.error("no convertible gesture — nothing written");
  process.exit(0);
}

if (iOSVersion) trace.draft.iOSVersion = iOSVersion;
if (iPhoneVersion) trace.draft.iPhoneVersion = iPhoneVersion;

const flags = validate(trace.draft);
for (const f of flags) {
  console.error(`validator flag — ${f.detail}`);
}

const id = `${trace.platform}-${slugify(trace.sessionGoal)}-${Date.parse(trace.sessionStartedAt)}`;
const result = await new FileCaptureStoreSink({ outDir, id }).finalize(trace.draft, trace.orderedScreens);

if (!result.video.ok) {
  console.error(`recording.mp4 not written (${result.video.reason})`);
  console.error("Analyze with: tsx analyze.ts --trace <id> --skip-vision");
}

console.log(`wrote ${result.path}`);
