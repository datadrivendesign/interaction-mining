import { test } from "node:test";
import assert from "node:assert/strict";
import { createDccWorkerServer } from "../server.mjs";

async function withServer(deps, fn) {
  const server = createDccWorkerServer(deps);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("GET /health returns 200 ok", async () => {
  await withServer({ authToken: "secret", enqueue: () => {} }, async (base) => {
    const res = await fetch(`${base}/health`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true });
  });
});

test("POST /dispatch without a matching bearer token is rejected", async () => {
  await withServer({ authToken: "secret", enqueue: () => {} }, async (base) => {
    const res = await fetch(`${base}/dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ crawlRequestId: "1", targetInput: "https://a.example", description: "x" }),
    });
    assert.equal(res.status, 401);
  });
});

test("POST /dispatch with a valid payload enqueues the job and returns 202", async () => {
  const enqueued = [];
  await withServer({ authToken: "secret", enqueue: (job) => enqueued.push(job) }, async (base) => {
    const res = await fetch(`${base}/dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer secret" },
      body: JSON.stringify({ crawlRequestId: "1", targetInput: "https://a.example", description: "find pricing" }),
    });
    assert.equal(res.status, 202);
    assert.deepEqual(await res.json(), { accepted: true });
    assert.deepEqual(enqueued, [{ crawlRequestId: "1", targetInput: "https://a.example", description: "find pricing" }]);
  });
});

test("POST /dispatch rejects a non-http(s) targetInput", async () => {
  const enqueued = [];
  await withServer({ authToken: "secret", enqueue: (job) => enqueued.push(job) }, async (base) => {
    const res = await fetch(`${base}/dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer secret" },
      body: JSON.stringify({ crawlRequestId: "1", targetInput: "com.whatsapp", description: "x" }),
    });
    assert.equal(res.status, 400);
    assert.equal(enqueued.length, 0);
  });
});

test("POST /dispatch rejects a Play Store targetInput", async () => {
  const enqueued = [];
  await withServer({ authToken: "secret", enqueue: (job) => enqueued.push(job) }, async (base) => {
    const res = await fetch(`${base}/dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer secret" },
      body: JSON.stringify({
        crawlRequestId: "1",
        targetInput: "https://play.google.com/store/apps/details?id=com.whatsapp",
        description: "x",
      }),
    });
    assert.equal(res.status, 400);
    assert.equal(enqueued.length, 0);
  });
});

test("POST /dispatch rejects a loopback/private targetInput", async () => {
  const enqueued = [];
  await withServer({ authToken: "secret", enqueue: (job) => enqueued.push(job) }, async (base) => {
    const res = await fetch(`${base}/dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer secret" },
      body: JSON.stringify({
        crawlRequestId: "1",
        targetInput: "http://127.0.0.1:11434",
        description: "x",
      }),
    });
    assert.equal(res.status, 400);
    assert.equal(enqueued.length, 0);
  });
});

test("unknown routes return 404", async () => {
  await withServer({ authToken: "secret", enqueue: () => {} }, async (base) => {
    const res = await fetch(`${base}/nope`);
    assert.equal(res.status, 404);
  });
});
