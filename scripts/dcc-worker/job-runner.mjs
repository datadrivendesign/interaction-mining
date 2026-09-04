import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Runs `dcc run` for one crawl request and resolves with its outcome, read
 * from the trace directory's result.json once the process exits.
 * @param {{crawlRequestId: string, targetInput: string, description: string}} job
 * @param {{
 *   dccCliPath: string,
 *   traceRoot: string,
 *   maxSteps?: number,
 *   maxMs?: number,
 *   spawnFn?: typeof spawn,
 *   readFileFn?: typeof readFile,
 * }} opts
 * @returns {Promise<{status: string, error?: string, traceDir: string}>}
 */
export async function runJob(job, opts) {
  const spawnFn = opts.spawnFn ?? spawn;
  const readFileFn = opts.readFileFn ?? readFile;
  const maxSteps = opts.maxSteps ?? 12;
  const maxMs = opts.maxMs ?? 600000;
  const traceDir = path.join(
    opts.traceRoot,
    `crawl-${job.crawlRequestId}-${Date.now()}`,
  );

  const args = [
    opts.dccCliPath,
    "run",
    "--target", "web",
    "--url", job.targetInput,
    "--goal", job.description,
    "--brain", "qwen",
    "--trace-dir", traceDir,
    "--max-steps", String(maxSteps),
    "--max-ms", String(maxMs),
  ];

  await new Promise((resolve) => {
    const child = spawnFn("node", args, { stdio: "inherit" });
    child.on("exit", () => resolve());
    child.on("error", () => resolve());
  });

  try {
    const raw = await readFileFn(path.join(traceDir, "result.json"), "utf8");
    const result = JSON.parse(raw);
    if (typeof result.status !== "string") {
      return { status: "error", error: "result.json missing status", traceDir };
    }

    if (Array.isArray(result.steps)) {
      for (let i = 0; i < result.steps.length; i++) {
        const step = result.steps[i];
        if (!step || typeof step !== "object") continue;
        const stepNum = typeof step.step === "number" ? step.step : i;
        const candidatePaths = [
          path.join(traceDir, "steps", String(stepNum).padStart(4, "0"), "screenshot.png"),
          path.join(traceDir, "steps", String(stepNum), "screenshot.png"),
          path.join(traceDir, "steps", String(i).padStart(4, "0"), "screenshot.png"),
          path.join(traceDir, "steps", `${stepNum}.png`),
        ];

        for (const candidatePath of candidatePaths) {
          try {
            const data = await readFileFn(candidatePath);
            step.screenshotBase64 = Buffer.isBuffer(data)
              ? data.toString("base64")
              : typeof data === "string"
              ? Buffer.from(data).toString("base64")
              : Buffer.from(String(data)).toString("base64");
            break;
          } catch {
            // try next candidate
          }
        }
      }
    }

    return {
      status: result.status,
      ...(typeof result.error === "string" ? { error: result.error } : {}),
      traceDir,
      result,
    };
  } catch (err) {
    return {
      status: "error",
      error: `failed to read result.json: ${err instanceof Error ? err.message : String(err)}`,
      traceDir,
    };
  }
}
