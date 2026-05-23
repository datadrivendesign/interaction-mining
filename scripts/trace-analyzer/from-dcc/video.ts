import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function ffmpegAvailable(): boolean {
  try {
    execSync("which ffmpeg", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export async function buildVideo(
  orderedScreens: { screenshotPath: string; timestamp: number }[],
  outPath: string
): Promise<{ ok: boolean; reason?: string }> {
  if (!ffmpegAvailable()) {
    return { ok: false, reason: "ffmpeg not found in PATH" };
  }
  if (orderedScreens.length === 0) {
    return { ok: false, reason: "no screens to encode" };
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dcc-video-"));
  const listPath = path.join(tmpDir, "concat.txt");

  try {
    // Build concat-demuxer list: each frame occupies [t_i, t_{i+1})
    const lines: string[] = [];
    for (let i = 0; i < orderedScreens.length; i++) {
      const { screenshotPath, timestamp } = orderedScreens[i];
      const next = orderedScreens[i + 1];
      const duration = next ? next.timestamp - timestamp : 1.0;
      lines.push(`file '${screenshotPath.replace(/'/g, "'\\''")}'`);
      lines.push(`duration ${duration.toFixed(3)}`);
    }
    // ffmpeg concat demuxer requires the last file to be listed twice
    const last = orderedScreens[orderedScreens.length - 1];
    lines.push(`file '${last.screenshotPath.replace(/'/g, "'\\''")}'`);
    fs.writeFileSync(listPath, lines.join("\n") + "\n");

    await new Promise<void>((resolve, reject) => {
      const proc = spawn("ffmpeg", [
        "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", listPath,
        "-vf", "fps=1",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        outPath,
      ], { stdio: "pipe" });

      proc.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited with code ${code}`));
      });
      proc.on("error", reject);
    });

    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
