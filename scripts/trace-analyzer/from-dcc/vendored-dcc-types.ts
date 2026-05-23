// Vendored from dcc/core/src/types/* at commit a339003 (ayush/odim-adapter branch)
// — keep in sync with DCC's trace shape. Bump this SHA and re-copy the relevant
// types when DCC's trace format changes. The converter regression test
// (convert.test.ts) catches obvious drift.

export type Platform = "web" | "android" | "ios" | "macos" | "windows";

export interface Viewport {
  readonly width: number;
  readonly height: number;
}

export interface PixelPoint {
  readonly x: number;
  readonly y: number;
}

export interface ActionableElement {
  readonly index: number;  // 1-based, stable within one Frame only
  readonly role: string;
  readonly label: string;
  readonly center: PixelPoint;  // viewport-pixel space — normalize before use
}

export type ScrollDirection = "up" | "down" | "left" | "right";
export type DoneStatus = "success" | "infeasible" | "needs_help";

export type Target =
  | { readonly by: "index"; readonly index: number }
  | { readonly by: "pixel"; readonly x: number; readonly y: number }
  | { readonly by: "description"; readonly text: string };

export type Action =
  | { readonly type: "click"; readonly target: Target; readonly thought?: string }
  | { readonly type: "type"; readonly text: string; readonly target?: Target; readonly thought?: string }
  | { readonly type: "key"; readonly key: string; readonly thought?: string }
  | { readonly type: "scroll"; readonly direction: ScrollDirection; readonly thought?: string }
  | { readonly type: "navigate_back"; readonly thought?: string }
  | { readonly type: "navigate_home"; readonly thought?: string }
  | { readonly type: "wait"; readonly ms?: number; readonly thought?: string }
  | { readonly type: "finding"; readonly description: string; readonly thought?: string }
  | { readonly type: "done"; readonly status: DoneStatus; readonly reason?: string; readonly thought?: string };

// On-disk serialization of Frame — screenshot Buffer is stripped, semanticTree may be null
export interface FrameJson {
  readonly platform: Platform;
  readonly viewport: Viewport;
  readonly locator: string;
  readonly capturedAt: string;
  readonly semanticTree: readonly ActionableElement[] | null;
}

export interface StepRecord {
  readonly step: number;
  readonly reason: string;
  readonly reflection: string;
  readonly action: Action;
  readonly latencyMs: number;
  readonly capturedAt: string;
}

export interface SessionMetadata {
  readonly goal: string;
  readonly startedAt: string;
  readonly budget: {
    readonly maxSteps: number;
    readonly maxWallClockMs: number;
    readonly maxTokens?: number;
  };
}

export interface SessionResult {
  readonly status: string;
  readonly steps: readonly StepRecord[];
  readonly findings: readonly string[];
  readonly error?: string;
}
