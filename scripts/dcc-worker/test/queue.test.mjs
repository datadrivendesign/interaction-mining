import { test } from "node:test";
import assert from "node:assert/strict";
import { JobQueue } from "../queue.mjs";

function deferred() {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
}

test("JobQueue runs jobs one at a time, in order, and posts each completion", async () => {
  const order = [];
  const gate = deferred();
  let runningCount = 0;
  let maxConcurrent = 0;

  const runJob = async (job) => {
    runningCount++;
    maxConcurrent = Math.max(maxConcurrent, runningCount);
    order.push(`run:${job.crawlRequestId}`);
    if (job.crawlRequestId === "a") await gate.promise;
    runningCount--;
    return { status: "success", traceDir: `/traces/${job.crawlRequestId}` };
  };

  const posted = [];
  const postCompletion = async (job, result) => {
    posted.push({ id: job.crawlRequestId, result });
    order.push(`post:${job.crawlRequestId}`);
  };

  const queue = new JobQueue({ runJob, postCompletion });
  queue.enqueue({ crawlRequestId: "a", targetInput: "https://a.example", description: "..." });
  queue.enqueue({ crawlRequestId: "b", targetInput: "https://b.example", description: "..." });

  // Let the microtask queue run "a" up to the gate before releasing it.
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(maxConcurrent, 1);
  assert.deepEqual(order, ["run:a"]);

  gate.resolve();
  await new Promise((r) => setTimeout(r, 10));

  assert.deepEqual(order, ["run:a", "post:a", "run:b", "post:b"]);
  assert.equal(posted.length, 2);
});

test("JobQueue calls onError and continues when runJob throws", async () => {
  const errors = [];
  const posted = [];
  const runJob = async (job) => {
    if (job.crawlRequestId === "bad") throw new Error("boom");
    return { status: "success", traceDir: "/traces/ok" };
  };
  const postCompletion = async (job) => posted.push(job.crawlRequestId);
  const onError = (job, err) => errors.push({ id: job.crawlRequestId, message: err.message });

  const queue = new JobQueue({ runJob, postCompletion, onError });
  queue.enqueue({ crawlRequestId: "bad", targetInput: "https://a.example", description: "..." });
  queue.enqueue({ crawlRequestId: "ok", targetInput: "https://b.example", description: "..." });

  await new Promise((r) => setTimeout(r, 10));

  assert.deepEqual(errors, [{ id: "bad", message: "boom" }]);
  assert.deepEqual(posted, ["ok"]);
});
