import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  GA_PATH_REDACTION_SCRIPT,
  normalizeAnalyticsPath,
} from "./normalize-path.ts";

// ObjectIds below are synthetic — shape only, never real records.
describe("normalizeAnalyticsPath", () => {
  it("redacts the capture id on the upload route", () => {
    assert.equal(
      normalizeAnalyticsPath("/capture/0123456789abcdef01234567/upload"),
      "/capture/[id]/upload",
    );
  });

  it("redacts every id in a path, not just the first", () => {
    assert.equal(
      normalizeAnalyticsPath(
        "/capture/0123456789abcdef01234567/trace/fedcba9876543210fedcba98/edit",
      ),
      "/capture/[id]/trace/[id]/edit",
    );
  });

  it("redacts a trailing id with no path after it", () => {
    assert.equal(
      normalizeAnalyticsPath("/capture/0123456789abcdef01234567"),
      "/capture/[id]",
    );
  });

  it("does not redact segments that merely look id-ish", () => {
    // Too short, too long, and non-hex must all survive — over-redacting would
    // collapse unrelated routes into one bucket.
    for (const path of [
      "/capture/abc/upload",
      "/capture/0123456789abcdef01234567ZZ/upload",
      "/capture/68150c7845c093a09dd1dcd/upload",
      "/archive/erica",
    ]) {
      assert.equal(normalizeAnalyticsPath(path), path, `should keep ${path}`);
    }
  });
});

describe("GA_PATH_REDACTION_SCRIPT", () => {
  it("applies the same redaction as the tested function", () => {
    // The inline script carries its own copy of the regex because it runs as
    // raw browser JS before any bundle loads. Evaluate it against a fake
    // `location` and confirm the two stay in step.
    const pathname = "/capture/0123456789abcdef01234567/upload";
    const pushed: unknown[][] = [];
    const sandbox = {
      window: { dataLayer: [] as unknown[] },
      location: { pathname, origin: "https://example.org", search: "" },
    };
    sandbox.window.dataLayer = {
      push: (...args: unknown[]) => pushed.push(args),
    } as unknown as unknown[];

    new Function("window", "location", GA_PATH_REDACTION_SCRIPT)(
      sandbox.window,
      sandbox.location,
    );

    const setCall = pushed[0]?.[0] as IArguments;
    const params = setCall[1] as { page_path: string; page_location: string };
    assert.equal(params.page_path, normalizeAnalyticsPath(pathname));
    assert.equal(
      params.page_location,
      `https://example.org${normalizeAnalyticsPath(pathname)}`,
    );
  });
});
