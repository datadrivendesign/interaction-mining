import { test } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import path from "node:path";
import { runJob } from "../job-runner.mjs";

const TRACE_DIR_RE = (crawlRequestId) =>
  new RegExp(`^/traces/crawl-${crawlRequestId}-\\d+$`);

function fakeSpawn(exitImmediately = true) {
  const calls = [];
  const spawnFn = (...args) => {
    calls.push(args);
    const child = new EventEmitter();
    if (exitImmediately) {
      queueMicrotask(() => child.emit("exit", 0));
    }
    return child;
  };
  spawnFn.calls = calls;
  return spawnFn;
}

test("runJob spawns dcc with the expected args and returns the parsed result", async () => {
  const spawnFn = fakeSpawn();
  const readFileFn = async (path) => {
    assert.match(path, /crawl-req-1-\d+[\\/]result\.json$/);
    return JSON.stringify({ status: "success" });
  };

  const result = await runJob(
    { crawlRequestId: "req-1", targetInput: "https://example.com", description: "find pricing" },
    { dccCliPath: "/dcc/cli/dist/cli.js", traceRoot: "/traces", spawnFn, readFileFn },
  );

  assert.equal(result.status, "success");
  assert.match(result.traceDir, TRACE_DIR_RE("req-1"));
  assert.equal(spawnFn.calls.length, 1);
  const [cmd, args] = spawnFn.calls[0];
  assert.equal(cmd, "node");
  assert.deepEqual(args, [
    "/dcc/cli/dist/cli.js",
    "run",
    "--target", "web",
    "--url", "https://example.com",
    "--goal", "find pricing",
    "--brain", "qwen",
    "--trace-dir", result.traceDir,
    "--max-steps", "12",
    "--max-ms", "600000",
  ]);
});

test("runJob returns status error when result.json is missing", async () => {
  const spawnFn = fakeSpawn();
  const readFileFn = async () => {
    throw new Error("ENOENT: no such file");
  };

  const result = await runJob(
    { crawlRequestId: "req-2", targetInput: "https://example.com", description: "..." },
    { dccCliPath: "/dcc/cli/dist/cli.js", traceRoot: "/traces", spawnFn, readFileFn },
  );

  assert.equal(result.status, "error");
  assert.match(result.error, /failed to read result\.json/);
  assert.match(result.traceDir, TRACE_DIR_RE("req-2"));
});

test("runJob returns status error when result.json has no status field", async () => {
  const spawnFn = fakeSpawn();
  const readFileFn = async () => JSON.stringify({ steps: [] });

  const result = await runJob(
    { crawlRequestId: "req-3", targetInput: "https://example.com", description: "..." },
    { dccCliPath: "/dcc/cli/dist/cli.js", traceRoot: "/traces", spawnFn, readFileFn },
  );

  assert.equal(result.status, "error");
  assert.match(result.error, /missing status/);
});

test("runJob forwards dcc's error field from result.json when present", async () => {
  const spawnFn = fakeSpawn();
  const readFileFn = async () =>
    JSON.stringify({ status: "error", error: "site blocked automated access" });

  const result = await runJob(
    { crawlRequestId: "req-4", targetInput: "https://example.com", description: "..." },
    { dccCliPath: "/dcc/cli/dist/cli.js", traceRoot: "/traces", spawnFn, readFileFn },
  );

  assert.equal(result.status, "error");
  assert.equal(result.error, "site blocked automated access");
  assert.match(result.traceDir, TRACE_DIR_RE("req-4"));
});

test("runJob omits error field when result.json doesn't include one", async () => {
  const spawnFn = fakeSpawn();
  const readFileFn = async () => JSON.stringify({ status: "success" });

  const result = await runJob(
    { crawlRequestId: "req-5", targetInput: "https://example.com", description: "..." },
    { dccCliPath: "/dcc/cli/dist/cli.js", traceRoot: "/traces", spawnFn, readFileFn },
  );

  assert.equal(result.status, "success");
  assert.equal("error" in result, false);
  assert.deepEqual(result.result, { status: "success" });
});

test("runJob loads screenshot.png as base64 into step.screenshotBase64 and returns result", async () => {
  const spawnFn = fakeSpawn();
  const fakePng0 = Buffer.from("fake-png-0");
  const fakePng1 = Buffer.from("fake-png-1");

  const readFileFn = async (filePath) => {
    if (filePath.endsWith("result.json")) {
      return JSON.stringify({
        status: "success",
        steps: [
          { step: 0, reason: "step 0" },
          { step: 1, reason: "step 1" },
        ],
        findings: ["item 1"],
      });
    }
    if (filePath.endsWith(path.join("0000", "screenshot.png"))) {
      return fakePng0;
    }
    if (filePath.endsWith(path.join("0001", "screenshot.png"))) {
      return fakePng1;
    }
    throw new Error("ENOENT: not found");
  };

  const result = await runJob(
    { crawlRequestId: "req-6", targetInput: "https://example.com", description: "goal" },
    { dccCliPath: "/dcc/cli/dist/cli.js", traceRoot: "/traces", spawnFn, readFileFn },
  );

  assert.equal(result.status, "success");
  assert.ok(result.result);
  assert.equal(result.result.steps.length, 2);
  assert.equal(result.result.steps[0].screenshotBase64, fakePng0.toString("base64"));
  assert.equal(result.result.steps[1].screenshotBase64, fakePng1.toString("base64"));
  assert.deepEqual(result.result.findings, ["item 1"]);
});

test("runJob leaves step.screenshotBase64 undefined when screenshot.png is absent", async () => {
  const spawnFn = fakeSpawn();
  const readFileFn = async (filePath) => {
    if (filePath.endsWith("result.json")) {
      return JSON.stringify({
        status: "success",
        steps: [{ step: 0, reason: "step 0" }],
      });
    }
    throw new Error("ENOENT: not found");
  };

  const result = await runJob(
    { crawlRequestId: "req-7", targetInput: "https://example.com", description: "goal" },
    { dccCliPath: "/dcc/cli/dist/cli.js", traceRoot: "/traces", spawnFn, readFileFn },
  );

  assert.equal(result.status, "success");
  assert.ok(result.result);
  assert.equal(result.result.steps.length, 1);
  assert.equal(result.result.steps[0].screenshotBase64, undefined);
});

