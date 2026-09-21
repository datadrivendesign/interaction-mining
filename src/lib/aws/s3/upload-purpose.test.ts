import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  UPLOAD_PURPOSE_CONFIG,
  UploadPurpose,
  buildUploadKey,
  safePathSegmentSchema,
  uploadUrlRequestSchema,
} from "./upload-purpose.ts";

// Synthetic ObjectId — shape only, not a real record.
const OID = "0123456789abcdef01234567";

const video = {
  purpose: UploadPurpose.CAPTURE_VIDEO,
  resourceId: OID,
  fileName: "1758087139379.mp4",
  contentType: "video/mp4",
  size: 1024,
};

const parse = (overrides: Record<string, unknown> = {}) =>
  uploadUrlRequestSchema.safeParse({ ...video, ...overrides });

describe("uploadUrlRequestSchema", () => {
  it("accepts a well-formed capture video request", () => {
    assert.equal(parse().success, true);
  });

  it("accepts every purpose with its own valid content type", () => {
    const cases = [
      [UploadPurpose.CAPTURE_VIDEO, "a.mov", "video/quicktime"],
      [UploadPurpose.CAPTURE_DRAFT, "draft-1.json", "application/json"],
      [UploadPurpose.TRACE_SCREEN, "s1.png", "image/png"],
      [UploadPurpose.TRACE_VH, "s1.json", "application/json"],
    ] as const;
    for (const [purpose, fileName, contentType] of cases) {
      assert.equal(
        parse({ purpose, fileName, contentType }).success,
        true,
        `${purpose} should accept ${contentType}`,
      );
    }
  });

  it("rejects a resourceId that is not an ObjectId", () => {
    for (const bad of ["", "abc", "x".repeat(24), `${OID}0`, "../../etc"]) {
      assert.equal(parse({ resourceId: bad }).success, false, `bad id: ${bad}`);
    }
  });

  it("rejects file names that could escape the namespace", () => {
    for (const bad of [
      "../evil.mp4",
      "a/../../evil.mp4",
      "nested/evil.mp4",
      "back\\slash.mp4",
      ".hidden.mp4",
      "bad\u0000name.mp4",
      "line\nbreak.mp4",
    ]) {
      assert.equal(parse({ fileName: bad }).success, false, `bad name: ${bad}`);
    }
  });

  it("rejects a content type the purpose does not allow", () => {
    assert.equal(parse({ contentType: "application/json" }).success, false);
    assert.equal(
      parse({
        purpose: UploadPurpose.TRACE_SCREEN,
        fileName: "s.png",
        contentType: "video/mp4",
      }).success,
      false,
    );
  });

  it("rejects an extension the purpose does not allow", () => {
    assert.equal(parse({ fileName: "clip.json" }).success, false);
    assert.equal(
      parse({
        purpose: UploadPurpose.TRACE_VH,
        fileName: "s.png",
        contentType: "application/json",
      }).success,
      false,
    );
  });

  it("accepts an uppercase extension", () => {
    assert.equal(
      parse({ fileName: "CLIP.MOV", contentType: "video/quicktime" }).success,
      true,
    );
  });

  it("enforces the per-purpose size ceiling", () => {
    const limit = UPLOAD_PURPOSE_CONFIG[UploadPurpose.CAPTURE_VIDEO].maxBytes;
    assert.equal(parse({ size: limit }).success, true);
    assert.equal(parse({ size: limit + 1 }).success, false);
  });
});

describe("safePathSegmentSchema", () => {
  // Segment shapes taken from real keys in the production bucket. An earlier
  // draft used an allowlist regex that rejected all of these.
  it("accepts the segment formats production actually uses", () => {
    for (const real of [
      "2026-02-21 16:21:44.690_TYPE_VIEW_CLICKED",
      "2025-05-05 01:07:13.908",
      "1758087139379.mp4",
      "draft-1758087139379.json",
      "original-metadata.json",
      "0123456789abcdef01234567.png",
    ]) {
      assert.equal(
        safePathSegmentSchema.safeParse(real).success,
        true,
        `should accept real segment: ${real}`,
      );
    }
  });

  it("still rejects anything that could escape its prefix", () => {
    for (const bad of [
      "..",
      "../escape",
      "a/b",
      "a\\b",
      ".hidden",
      "nul\u0000byte",
      "",
    ]) {
      assert.equal(
        safePathSegmentSchema.safeParse(bad).success,
        false,
        `should reject: ${JSON.stringify(bad)}`,
      );
    }
  });
});

describe("buildUploadKey", () => {
  it("places each purpose in its own namespace", () => {
    const expected = {
      [UploadPurpose.CAPTURE_VIDEO]: `uploads/${OID}/f.mp4`,
      [UploadPurpose.CAPTURE_DRAFT]: `uploads/${OID}/drafts/f.json`,
      [UploadPurpose.TRACE_SCREEN]: `traces/${OID}/screens/f.png`,
      [UploadPurpose.TRACE_VH]: `traces/${OID}/vhs/f.json`,
    };
    const names = {
      [UploadPurpose.CAPTURE_VIDEO]: ["f.mp4", "video/mp4"],
      [UploadPurpose.CAPTURE_DRAFT]: ["f.json", "application/json"],
      [UploadPurpose.TRACE_SCREEN]: ["f.png", "image/png"],
      [UploadPurpose.TRACE_VH]: ["f.json", "application/json"],
    } as const;

    for (const purpose of Object.values(UploadPurpose)) {
      const [fileName, contentType] = names[purpose];
      const parsed = parse({ purpose, fileName, contentType });
      assert.equal(parsed.success, true, `${purpose} should parse`);
      if (!parsed.success) continue;
      assert.equal(buildUploadKey(parsed.data), expected[purpose]);
    }
  });

  it("only ever builds keys under uploads/ or traces/", () => {
    for (const purpose of Object.values(UploadPurpose)) {
      const prefix = UPLOAD_PURPOSE_CONFIG[purpose].prefix(OID);
      assert.ok(
        prefix.startsWith("uploads/") || prefix.startsWith("traces/"),
        `${purpose} produced ${prefix}`,
      );
    }
  });
});
