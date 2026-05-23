import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mapStep } from "../map.ts";
import type { FrameJson, StepRecord } from "../vendored-dcc-types.ts";

const VIEWPORT = { width: 1280, height: 800 };

function makeFrame(overrides: Partial<FrameJson> = {}): FrameJson {
  return {
    platform: "web",
    viewport: VIEWPORT,
    locator: "http://example.com",
    capturedAt: "2026-01-01T00:00:00.000Z",
    semanticTree: [
      { index: 1, role: "button", label: "Submit", center: { x: 640, y: 400 } },
    ],
    ...overrides,
  };
}

function makeRecord(action: StepRecord["action"], reason = "do the thing"): StepRecord {
  return {
    step: 1,
    reason,
    reflection: "",
    action,
    latencyMs: 100,
    capturedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("mapStep — click", () => {
  it("by:pixel passes coords through [0,1]", () => {
    const result = mapStep(
      makeRecord({ type: "click", target: { by: "pixel", x: 0.5, y: 0.3 } }),
      makeFrame(),
      "screenshot.png",
      null,
      "test goal"
    );
    assert.ok(result);
    assert.equal(result.gesture.type, "tap");
    assert.equal(result.gesture.x, 0.5);
    assert.equal(result.gesture.y, 0.3);
    assert.equal(result.gesture.scrollDeltaX, null);
    assert.equal(result.gesture.scrollDeltaY, null);
  });

  it("by:index resolves from semanticTree and normalizes to [0,1]", () => {
    const result = mapStep(
      makeRecord({ type: "click", target: { by: "index", index: 1 } }),
      makeFrame(),
      "screenshot.png",
      null,
      "test goal"
    );
    assert.ok(result);
    assert.equal(result.gesture.type, "tap");
    assert.equal(result.gesture.x, 640 / 1280);
    assert.equal(result.gesture.y, 400 / 800);
  });

  it("by:description returns null (drop)", () => {
    const result = mapStep(
      makeRecord({ type: "click", target: { by: "description", text: "Submit button" } }),
      makeFrame(),
      "screenshot.png",
      null,
      "test goal"
    );
    assert.equal(result, null);
  });
});

describe("mapStep — type", () => {
  it("with target uses target coords", () => {
    const result = mapStep(
      makeRecord({ type: "type", text: "hello", target: { by: "pixel", x: 0.4, y: 0.25 } }),
      makeFrame(),
      "screenshot.png",
      null,
      "test goal"
    );
    assert.ok(result);
    assert.equal(result.gesture.type, "typing");
    assert.equal(result.gesture.x, 0.4);
    assert.equal(result.gesture.y, 0.25);
  });

  it("without target inherits prior tap coords", () => {
    const prior = { x: 0.6, y: 0.35 };
    const result = mapStep(
      makeRecord({ type: "type", text: "hello" }),
      makeFrame({ semanticTree: [] }),
      "screenshot.png",
      prior,
      "test goal"
    );
    assert.ok(result);
    assert.equal(result.gesture.type, "typing");
    assert.equal(result.gesture.x, 0.6);
    assert.equal(result.gesture.y, 0.35);
  });

  it("without target and no prior tap returns null (drop)", () => {
    const result = mapStep(
      makeRecord({ type: "type", text: "hello" }),
      makeFrame({ semanticTree: [] }),
      "screenshot.png",
      null,
      "test goal"
    );
    assert.equal(result, null);
  });
});

describe("mapStep — scroll", () => {
  it("scroll up → swipe up, scrollDeltaY = -0.3", () => {
    const result = mapStep(
      makeRecord({ type: "scroll", direction: "up" }),
      makeFrame(),
      "screenshot.png",
      null,
      "test goal"
    );
    assert.ok(result);
    assert.equal(result.gesture.type, "swipe up");
    assert.equal(result.gesture.x, null);
    assert.equal(result.gesture.y, null);
    assert.equal(result.gesture.scrollDeltaY, -0.3);
    assert.equal(result.gesture.scrollDeltaX, null);
  });

  it("scroll down → swipe down, scrollDeltaY = +0.3", () => {
    const result = mapStep(
      makeRecord({ type: "scroll", direction: "down" }),
      makeFrame(),
      "screenshot.png",
      null,
      "test goal"
    );
    assert.ok(result);
    assert.equal(result.gesture.type, "swipe down");
    assert.equal(result.gesture.scrollDeltaY, 0.3);
  });

  it("scroll left → swipe left, scrollDeltaX = -0.3", () => {
    const result = mapStep(
      makeRecord({ type: "scroll", direction: "left" }),
      makeFrame(),
      "screenshot.png",
      null,
      "test goal"
    );
    assert.ok(result);
    assert.equal(result.gesture.type, "swipe left");
    assert.equal(result.gesture.scrollDeltaX, -0.3);
    assert.equal(result.gesture.scrollDeltaY, null);
  });

  it("scroll right → swipe right, scrollDeltaX = +0.3", () => {
    const result = mapStep(
      makeRecord({ type: "scroll", direction: "right" }),
      makeFrame(),
      "screenshot.png",
      null,
      "test goal"
    );
    assert.ok(result);
    assert.equal(result.gesture.type, "swipe right");
    assert.equal(result.gesture.scrollDeltaX, 0.3);
  });
});

describe("mapStep — dropped action types", () => {
  for (const type of ["key", "navigate_back", "navigate_home", "wait", "finding", "done"] as const) {
    it(`${type} returns null`, () => {
      const action =
        type === "key" ? { type: "key" as const, key: "Enter" }
        : type === "finding" ? { type: "finding" as const, description: "found it" }
        : type === "done" ? { type: "done" as const, status: "success" as const }
        : type === "wait" ? { type: "wait" as const }
        : { type } as { type: "navigate_back" | "navigate_home" };
      const result = mapStep(makeRecord(action as StepRecord["action"]), makeFrame(), "s.png", null, "goal");
      assert.equal(result, null);
    });
  }
});

describe("mapStep — descriptions", () => {
  it("tap description matches template", () => {
    const result = mapStep(
      makeRecord({ type: "click", target: { by: "index", index: 1 } }, "do the thing"),
      makeFrame(),
      "screenshot.png",
      null,
      "test goal"
    );
    assert.ok(result);
    assert.match(result.gesture.description ?? "", /^Tap .+ to .+$/);
  });

  it("80-char goal cap: 81-char reason is truncated to 80", () => {
    const longReason = "a".repeat(81);
    const result = mapStep(
      makeRecord({ type: "click", target: { by: "pixel", x: 0.5, y: 0.5 } }, longReason),
      makeFrame(),
      "screenshot.png",
      null,
      "goal"
    );
    assert.ok(result);
    const desc = result.gesture.description ?? "";
    // The goal portion is capped at 80 chars
    const goalPart = desc.replace(/^Tap .+ to /, "");
    assert.ok(goalPart.length <= 80, `goal part too long: ${goalPart.length}`);
  });
});
