export type ActionPayload<T> =
  | { ok: true; message: string; data: T }
  | { ok: false; message: string; data: null };