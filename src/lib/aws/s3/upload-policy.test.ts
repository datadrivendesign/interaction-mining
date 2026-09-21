import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  UPLOAD_POLICY,
  backoffDelayMs,
  classifyPutFailure,
  classifySigningFailure,
  describeExhaustion,
  hasBudgetRemaining,
} from "./upload-policy.ts";

describe("classifyPutFailure", () => {
  it("retries transient failures", () => {
    // 0 = no response reached script: network drop or CORS rejection.
    for (const status of [0, 408, 429, 500, 502, 503, 504]) {
      assert.equal(classifyPutFailure(status), "retry", `status ${status}`);
    }
  });

  it("does not retry failures the server will keep rejecting", () => {
    // 403 is the expected result of a signature, size or type mismatch, so
    // retrying it would burn the budget on a request that cannot succeed.
    for (const status of [400, 401, 403, 404, 411, 412, 413, 415, 422]) {
      assert.equal(classifyPutFailure(status), "permanent", `status ${status}`);
    }
  });
});

describe("classifySigningFailure", () => {
  it("retries when the action call never completed or the server erred", () => {
    for (const status of [undefined, 0, 408, 429, 500, 503]) {
      assert.equal(classifySigningFailure(status), "retry", `status ${status}`);
    }
  });

  it("does not retry auth or validation rejections", () => {
    for (const status of [400, 401, 403, 404]) {
      assert.equal(
        classifySigningFailure(status),
        "permanent",
        `status ${status}`,
      );
    }
  });
});

describe("backoffDelayMs", () => {
  const { baseMs, factor, capMs } = UPLOAD_POLICY.backoff;

  it("uses full jitter: 0 at minimum, the ceiling at maximum", () => {
    assert.equal(
      backoffDelayMs(1, () => 0),
      0,
    );
    assert.equal(
      backoffDelayMs(1, () => 1),
      baseMs,
    );
  });

  it("grows exponentially with the attempt number", () => {
    assert.equal(
      backoffDelayMs(1, () => 1),
      baseMs,
    );
    assert.equal(
      backoffDelayMs(2, () => 1),
      baseMs * factor,
    );
    assert.equal(
      backoffDelayMs(3, () => 1),
      baseMs * factor * factor,
    );
  });

  it("never exceeds the cap, however many attempts", () => {
    for (const attempt of [1, 2, 3, 4, 10, 50]) {
      assert.ok(
        backoffDelayMs(attempt, () => 1) <= capMs,
        `attempt ${attempt} exceeded cap`,
      );
    }
  });
});

describe("hasBudgetRemaining", () => {
  it("tracks the PUT and signing budgets separately", () => {
    // A signing outage must not consume PUT attempts.
    assert.equal(hasBudgetRemaining("signing", 2), true);
    assert.equal(
      hasBudgetRemaining("signing", UPLOAD_POLICY.maxSigningAttempts),
      false,
    );
    assert.equal(hasBudgetRemaining("put", 3), true);
    assert.equal(
      hasBudgetRemaining("put", UPLOAD_POLICY.maxPutAttempts),
      false,
    );
  });
});
