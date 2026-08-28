import { test } from "node:test";
import assert from "node:assert/strict";
import { postCompletion } from "../callback.mjs";

test("postCompletion sends the expected request and resolves on 2xx", async () => {
  const calls = [];
  const fetchFn = async (url, init) => {
    calls.push({ url, init });
    return { ok: true, status: 200 };
  };

  await postCompletion(
    { crawlRequestId: "req-1" },
    { status: "success", traceDir: "/traces/crawl-req-1" },
    { callbackBaseUrl: "https://app.example.com", authToken: "secret", fetchFn },
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://app.example.com/api/crawl-requests/req-1/complete");
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.headers.Authorization, "Bearer secret");
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    status: "success",
    traceDir: "/traces/crawl-req-1",
  });
});

test("postCompletion retries on failure and eventually succeeds", async () => {
  let attempts = 0;
  const fetchFn = async () => {
    attempts++;
    if (attempts < 2) return { ok: false, status: 503 };
    return { ok: true, status: 200 };
  };

  await postCompletion(
    { crawlRequestId: "req-2" },
    { status: "success", traceDir: "/traces/crawl-req-2" },
    { callbackBaseUrl: "https://app.example.com", authToken: "secret", fetchFn, retries: 3, retryDelayMs: 0 },
  );

  assert.equal(attempts, 2);
});

test("postCompletion throws after exhausting all retries", async () => {
  const fetchFn = async () => ({ ok: false, status: 500 });

  await assert.rejects(
    () =>
      postCompletion(
        { crawlRequestId: "req-3" },
        { status: "success", traceDir: "/traces/crawl-req-3" },
        { callbackBaseUrl: "https://app.example.com", authToken: "secret", fetchFn, retries: 2, retryDelayMs: 0 },
      ),
    /500/,
  );
});
