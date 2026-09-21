import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  androidFrameUploadSchema,
  androidMetadataUploadSchema,
} from "./android-upload.ts";

/**
 * Payloads shaped exactly as the Android client builds them in
 * `UploadDataOps` (odim-android). An earlier draft of these schemas rejected
 * the real `id` format and would have 400'd every Android upload, so these
 * cases exist to keep that from recurring.
 */
const SCREEN_ID = "2026-02-21 16:21:44.690_TYPE_VIEW_CLICKED";
const CREATED = "2026-02-21 16:21:44.690";

describe("androidFrameUploadSchema", () => {
  const frame = {
    vh: '{"node":"root"}',
    img: "iVBORw0KGgoAAAANSUhEUg==",
    created: CREATED,
    id: SCREEN_ID,
  };

  it("accepts the real client payload", () => {
    assert.equal(androidFrameUploadSchema.safeParse(frame).success, true);
  });

  it("accepts every gesture-type suffix the client can produce", () => {
    for (const suffix of [
      "TYPE_VIEW_CLICKED",
      "TYPE_VIEW_SELECTED",
      "TYPE_VIEW_UNKNOWN",
      "TYPE_VIEW_SCROLLED",
      "TYPE_VIEW_LONG_CLICKED",
    ]) {
      const id = `${CREATED}_${suffix}`;
      assert.equal(
        androidFrameUploadSchema.safeParse({ ...frame, id }).success,
        true,
        `should accept id: ${id}`,
      );
    }
  });

  it("forwards unknown fields instead of dropping them", () => {
    const parsed = androidFrameUploadSchema.safeParse({
      ...frame,
      gesture: { x: 0.5, y: 0.5 },
    });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.deepEqual(
        (parsed.data as Record<string, unknown>).gesture,
        { x: 0.5, y: 0.5 },
        "a field absent from the schema must survive",
      );
    }
  });

  it("rejects an id that could escape its prefix", () => {
    for (const bad of ["../escape", "a/b", "..", ".hidden"]) {
      assert.equal(
        androidFrameUploadSchema.safeParse({ ...frame, id: bad }).success,
        false,
        `should reject id: ${bad}`,
      );
    }
  });
});

describe("androidMetadataUploadSchema", () => {
  const metadata = {
    screens: [{ timestamp: CREATED, id: SCREEN_ID }],
    gestures: {
      [SCREEN_ID]: {
        x: 0.5,
        y: 0.49789914,
        scrollDeltaX: 0,
        scrollDeltaY: 0,
        type: "TYPE_VIEW_CLICKED",
      },
    },
    redactions: { [SCREEN_ID]: [] },
  };

  it("accepts the real client payload", () => {
    assert.equal(androidMetadataUploadSchema.safeParse(metadata).success, true);
  });

  it("accepts the client's FileNotFoundException fallback gesture", () => {
    // The client substitutes integer zeros and an empty type when no gesture
    // file exists for a screen.
    const fallback = {
      ...metadata,
      gestures: {
        [SCREEN_ID]: { x: 0, y: 0, scrollDeltaX: 0, scrollDeltaY: 0, type: "" },
      },
    };
    assert.equal(androidMetadataUploadSchema.safeParse(fallback).success, true);
  });

  it("accepts populated redactions", () => {
    const withRedactions = {
      ...metadata,
      redactions: {
        [SCREEN_ID]: [{ x: 1, y: 2, endX: 3, endY: 4, label: "email" }],
      },
    };
    assert.equal(
      androidMetadataUploadSchema.safeParse(withRedactions).success,
      true,
    );
  });

  it("rejects a screen with no gesture or redactions entry, so the handler cannot throw", () => {
    assert.equal(
      androidMetadataUploadSchema.safeParse({ ...metadata, gestures: {} })
        .success,
      false,
    );
    assert.equal(
      androidMetadataUploadSchema.safeParse({ ...metadata, redactions: {} })
        .success,
      false,
    );
  });

  it("rejects redactions that are not an array", () => {
    assert.equal(
      androidMetadataUploadSchema.safeParse({
        ...metadata,
        redactions: { [SCREEN_ID]: { x: 1 } },
      }).success,
      false,
    );
  });

  it("forwards unknown gesture fields instead of dropping them", () => {
    const parsed = androidMetadataUploadSchema.safeParse({
      ...metadata,
      gestures: {
        [SCREEN_ID]: { ...metadata.gestures[SCREEN_ID], className: "Button" },
      },
    });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      const gesture = (parsed.data.gestures as Record<string, unknown>)[
        SCREEN_ID
      ] as Record<string, unknown>;
      assert.equal(gesture.className, "Button");
    }
  });
});
