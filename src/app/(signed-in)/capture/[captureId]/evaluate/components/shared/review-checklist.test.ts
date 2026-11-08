import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getChecklistStatus,
  passUnflaggedSteps,
  type ReviewChecklist,
} from "./review-checklist.ts";

const noNotes = { commentsByScreen: {}, flowComments: [] };
const oneNote = {
  commentsByScreen: { s1: [{ id: "c1", text: "Screen 1: fix" }] },
  flowComments: [],
};
const allPass: ReviewChecklist = passUnflaggedSteps({});

describe("getChecklistStatus", () => {
  it("blocks both verdicts before any step is marked", () => {
    const status = getChecklistStatus({}, noNotes);
    assert.equal(status.checkedCount, 0);
    assert.equal(status.label, "0 of 6 steps checked");
    assert.ok(status.approveBlockedReason);
    assert.ok(status.sendBackBlockedReason);
  });

  it("allows Approve only when all six steps pass", () => {
    assert.equal(
      getChecklistStatus(allPass, noNotes).approveBlockedReason,
      null,
    );
    const fiveOfSix = { ...allPass, redaction: undefined };
    assert.ok(getChecklistStatus(fiveOfSix, noNotes).approveBlockedReason);
  });

  it("needs an Issue step and a note to send back", () => {
    const flagged: ReviewChecklist = { gesture: "issue" };
    assert.equal(
      getChecklistStatus(flagged, noNotes).sendBackBlockedReason,
      "To send back, add a note for the worker.",
    );
    assert.equal(
      getChecklistStatus(flagged, oneNote).sendBackBlockedReason,
      null,
    );
    // A note alone is not enough: the step must be marked Issue.
    assert.ok(getChecklistStatus(allPass, oneNote).sendBackBlockedReason);
  });
});

describe("passUnflaggedSteps", () => {
  it("keeps steps marked Issue", () => {
    const next = passUnflaggedSteps({ description: "issue" });
    assert.equal(next.description, "issue");
    assert.equal(next.recording, "pass");
    assert.equal(Object.values(next).length, 6);
  });
});
