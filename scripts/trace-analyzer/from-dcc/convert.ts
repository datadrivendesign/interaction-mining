import fs from "node:fs";
import path from "node:path";
import type { DraftFrameData, DraftTraceFormData, ScreenGesture } from "../types.ts";
import type { FrameJson, SessionMetadata, SessionResult, StepRecord } from "./vendored-dcc-types.ts";
import { mapStep } from "./map.ts";

export type OdimTrace = {
  draft: DraftTraceFormData;
  orderedScreens: { screenshotPath: string; timestamp: number }[];
  platform: string;
  sessionGoal: string;
  sessionStartedAt: string;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

export async function readTrace(traceDir: string): Promise<OdimTrace | null> {
  const sessionPath = path.join(traceDir, "session.json");
  const session = readJson<SessionMetadata>(sessionPath);

  const stepsDir = path.join(traceDir, "steps");
  const stepDirs = fs
    .readdirSync(stepsDir)
    .filter((d) => /^\d{4}$/.test(d))
    .sort()
    .map((d) => path.join(stepsDir, d));

  // Read all steps
  const steps: Array<{ record: StepRecord; frame: FrameJson; screenshotPath: string }> = [];
  for (const stepDir of stepDirs) {
    const recordPath = path.join(stepDir, "record.json");
    const framePath = path.join(stepDir, "frame.json");
    const screenshotPath = path.join(stepDir, "screenshot.png");
    if (!fs.existsSync(recordPath) || !fs.existsSync(framePath)) continue;
    steps.push({
      record: readJson<StepRecord>(recordPath),
      frame: readJson<FrameJson>(framePath),
      screenshotPath,
    });
  }

  if (steps.length === 0) return null;

  // Detect platform from session or first frame
  const platform = steps[0].frame.platform;

  // Map steps to gestures; track prevTapCoords for type-without-target
  const gestureScreens: Array<{
    frameData: DraftFrameData;
    gesture: ScreenGesture;
    screenshotPath: string;
  }> = [];

  let prevTapCoords: { x: number; y: number } | null = null;
  let firstCapturedAt: number | null = null;
  let doneStep: { frame: FrameJson; screenshotPath: string; capturedAt: string } | null = null;

  for (const { record, frame, screenshotPath } of steps) {
    if (record.action.type === "done") {
      doneStep = { frame, screenshotPath, capturedAt: record.capturedAt };
      continue;
    }

    const mapped = mapStep(record, frame, screenshotPath, prevTapCoords, session.goal);
    if (!mapped) continue;

    const capturedMs = Date.parse(record.capturedAt);
    if (firstCapturedAt === null) firstCapturedAt = capturedMs;

    let t = (capturedMs - firstCapturedAt) / 1000;

    // Enforce strictly-increasing timestamps
    if (gestureScreens.length > 0) {
      const lastT = gestureScreens[gestureScreens.length - 1].frameData.timestamp;
      if (t <= lastT) t = lastT + 0.001;
    }

    const id = `${t}-${slugify(record.reason).slice(0, 20)}`;

    gestureScreens.push({
      frameData: { id, timestamp: t },
      gesture: mapped.gesture,
      screenshotPath: mapped.screenshotPath,
    });

    if (mapped.gesture.type === "tap") {
      prevTapCoords =
        mapped.gesture.x !== null && mapped.gesture.y !== null
          ? { x: mapped.gesture.x, y: mapped.gesture.y }
          : null;
    }
  }

  if (gestureScreens.length === 0) return null;

  const lastT = gestureScreens[gestureScreens.length - 1].frameData.timestamp;
  const trailingTimestamp = lastT + 1.0;
  const trailingId = `${trailingTimestamp}-end`;
  const trailingScreenshot = doneStep?.screenshotPath ?? gestureScreens[gestureScreens.length - 1].screenshotPath;

  const trailingFrameData: DraftFrameData = { id: trailingId, timestamp: trailingTimestamp };

  // Build DraftTraceFormData
  const screens: DraftFrameData[] = [
    ...gestureScreens.map((s) => s.frameData),
    trailingFrameData,
  ];

  const gestures: { [screenId: string]: ScreenGesture } = {};
  for (const s of gestureScreens) {
    gestures[s.frameData.id] = s.gesture;
  }
  // No entry for trailing screen — last screen intentionally has no gesture

  const draft: DraftTraceFormData = {
    screens,
    gestures,
    redactions: {},
    description: session.goal,
  };

  const orderedScreens = [
    ...gestureScreens.map((s) => ({ screenshotPath: s.screenshotPath, timestamp: s.frameData.timestamp })),
    { screenshotPath: trailingScreenshot, timestamp: trailingTimestamp },
  ];

  return {
    draft,
    orderedScreens,
    platform,
    sessionGoal: session.goal,
    sessionStartedAt: session.startedAt,
  };
}
