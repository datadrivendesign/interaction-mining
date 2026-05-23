import fs from "node:fs";
import path from "node:path";
import type { DraftTraceFormData } from "../types.ts";
import { buildVideo } from "./video.ts";

export class FileCaptureStoreSink {
  private captureDir: string;

  constructor(private opts: { outDir: string; id: string }) {
    this.captureDir = path.join(opts.outDir, opts.id);
  }

  async finalize(
    draft: DraftTraceFormData,
    orderedScreens: { screenshotPath: string; timestamp: number }[]
  ): Promise<{ path: string; video: { ok: boolean; reason?: string } }> {
    fs.mkdirSync(this.captureDir, { recursive: true });

    // Atomic write: write to .tmp then rename
    const historyPath = path.join(this.captureDir, "interaction_history.json");
    const tmpPath = historyPath + ".tmp";
    fs.writeFileSync(tmpPath, JSON.stringify(draft, null, 2));
    fs.renameSync(tmpPath, historyPath);

    const videoPath = path.join(this.captureDir, "recording.mp4");
    const video = await buildVideo(orderedScreens, videoPath);

    return { path: this.captureDir, video };
  }
}
