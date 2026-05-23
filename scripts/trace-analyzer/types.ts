export type DraftFrameData = {
  id: string;
  timestamp: number;
};

export type Redaction = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  annotation: string;
};

export type ScreenGesture = {
  type: string | null;
  description: string | null;
  x: number | null;
  y: number | null;
  scrollDeltaX: number | null;
  scrollDeltaY: number | null;
};

export type DraftTraceFormData = {
  screens: DraftFrameData[];
  gestures: { [screenId: string]: ScreenGesture };
  redactions: { [screenId: string]: Redaction[] };
  description: string;
  iPhoneVersion?: string;
  iOSVersion?: string;
};

export type RuleIssue = {
  issueId: string;
  screenIndex: number | null;
  detail: string;
};
