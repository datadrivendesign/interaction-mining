"use client";

import { useCallback, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { findTraceIssueByShortcut } from "./trace-issues";

export type ReviewCommentHotkeyAction =
  | {
      nonce: number;
      type: "select-issue";
      issueId: string;
    }
  | {
      nonce: number;
      type: "select-other";
    }
  | {
      nonce: number;
      type: "remove-last-screen-comment";
    };

type ReviewCommentHotkeyActionInput =
  | {
      type: "select-issue";
      issueId: string;
    }
  | {
      type: "select-other";
    }
  | {
      type: "remove-last-screen-comment";
    };

export function useReviewCommentHotkeys({
  isSubmitting,
  sortedScreensLength,
  hasActiveScreen,
  onScreenStep,
}: {
  isSubmitting: boolean;
  sortedScreensLength: number;
  hasActiveScreen: boolean;
  onScreenStep: (offset: number) => void;
}) {
  const [hotkeyAction, setHotkeyAction] =
    useState<ReviewCommentHotkeyAction | null>(null);
  const hotkeyActionNonceRef = useRef(0);

  const queueHotkeyAction = useCallback(
    (action: ReviewCommentHotkeyActionInput) => {
      hotkeyActionNonceRef.current += 1;
      setHotkeyAction({
        ...action,
        nonce: hotkeyActionNonceRef.current,
      });
    },
    [],
  );

  useHotkeys(
    "bracketleft",
    (event) => {
      event.preventDefault();
      onScreenStep(-1);
    },
    {
      enabled: !isSubmitting && sortedScreensLength > 0,
      enableOnFormTags: false,
      enableOnContentEditable: false,
      ignoreEventWhen: (event) => event.repeat,
      preventDefault: true,
    },
    [isSubmitting, onScreenStep, sortedScreensLength],
  );

  useHotkeys(
    "bracketright",
    (event) => {
      event.preventDefault();
      onScreenStep(1);
    },
    {
      enabled: !isSubmitting && sortedScreensLength > 0,
      enableOnFormTags: false,
      enableOnContentEditable: false,
      ignoreEventWhen: (event) => event.repeat,
      preventDefault: true,
    },
    [isSubmitting, onScreenStep, sortedScreensLength],
  );

  useHotkeys(
    "o",
    (event) => {
      event.preventDefault();
      queueHotkeyAction({ type: "select-other" });
    },
    {
      enabled: !isSubmitting,
      enableOnFormTags: false,
      enableOnContentEditable: false,
      ignoreEventWhen: (event) => event.repeat,
      preventDefault: true,
    },
    [isSubmitting, queueHotkeyAction],
  );

  useHotkeys(
    "backspace",
    (event) => {
      event.preventDefault();
      queueHotkeyAction({
        type: "remove-last-screen-comment",
      });
    },
    {
      enabled: !isSubmitting && hasActiveScreen,
      enableOnFormTags: false,
      enableOnContentEditable: false,
      ignoreEventWhen: (event) => event.repeat,
      preventDefault: true,
    },
    [hasActiveScreen, isSubmitting, queueHotkeyAction],
  );

  useHotkeys(
    "1,2,3,4,5,6,7,8,9",
    (event) => {
      const shortcutIssue = findTraceIssueByShortcut(
        Number.parseInt(event.key, 10),
      );
      if (!shortcutIssue) {
        return;
      }

      event.preventDefault();
      queueHotkeyAction({
        type: "select-issue",
        issueId: shortcutIssue.id,
      });
    },
    {
      enabled: !isSubmitting,
      enableOnFormTags: false,
      enableOnContentEditable: false,
      ignoreEventWhen: (event) => event.repeat,
      preventDefault: true,
    },
    [isSubmitting, queueHotkeyAction],
  );

  return {
    hotkeyAction,
    queueHotkeyAction,
  };
}
