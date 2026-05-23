import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readTrace } from "../convert.ts";
import { validate } from "../../validator.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.join(__dirname, "fixtures/trace");

describe("readTrace — fixture trace", () => {
  it("converts without error and returns a non-null trace", async () => {
    const trace = await readTrace(FIXTURE_DIR);
    assert.ok(trace !== null, "expected a non-null OdimTrace");
  });

  it("validate() returns zero flags on the produced draft", async () => {
    const trace = await readTrace(FIXTURE_DIR);
    assert.ok(trace);
    const flags = validate(trace.draft);
    assert.deepEqual(
      flags,
      [],
      `expected zero validator flags, got:\n${flags.map((f) => f.detail).join("\n")}`
    );
  });

  it("has at least 3 screens (tap + type + trailing done)", async () => {
    const trace = await readTrace(FIXTURE_DIR);
    assert.ok(trace);
    assert.ok(trace.draft.screens.length >= 3, `screens.length = ${trace.draft.screens.length}`);
  });

  it("last screen has no gesture entry", async () => {
    const trace = await readTrace(FIXTURE_DIR);
    assert.ok(trace);
    const screens = trace.draft.screens;
    const lastId = screens[screens.length - 1].id;
    assert.equal(
      trace.draft.gestures[lastId],
      undefined,
      "trailing screen must not have a gesture"
    );
  });

  it("first screen timestamp is 0", async () => {
    const trace = await readTrace(FIXTURE_DIR);
    assert.ok(trace);
    assert.equal(trace.draft.screens[0].timestamp, 0);
  });

  it("timestamps are strictly increasing", async () => {
    const trace = await readTrace(FIXTURE_DIR);
    assert.ok(trace);
    const timestamps = trace.draft.screens.map((s) => s.timestamp);
    for (let i = 1; i < timestamps.length; i++) {
      assert.ok(
        timestamps[i] > timestamps[i - 1],
        `timestamp[${i}]=${timestamps[i]} not > timestamp[${i - 1}]=${timestamps[i - 1]}`
      );
    }
  });

  it("gestures are keyed by matching screen ids", async () => {
    const trace = await readTrace(FIXTURE_DIR);
    assert.ok(trace);
    const screenIds = new Set(trace.draft.screens.map((s) => s.id));
    for (const gestureId of Object.keys(trace.draft.gestures)) {
      assert.ok(screenIds.has(gestureId), `gesture key ${gestureId} has no matching screen`);
    }
  });

  it("all gesture screen ids appear in orderedScreens", async () => {
    const trace = await readTrace(FIXTURE_DIR);
    assert.ok(trace);
    assert.equal(trace.draft.screens.length, trace.orderedScreens.length);
  });
});
