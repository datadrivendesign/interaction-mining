import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { ZodIssue } from "zod";

/** Cap on returned issues, so a large malformed payload cannot produce a large response. */
const MAX_REPORTED_ISSUES = 10;

/**
 * A 400 that says which check failed.
 *
 * The Android client logs the response body verbatim
 * (`Log.d("api", "... body: ${it.body?.string()}")`), so this text is what
 * someone debugging a failed upload reads in logcat. An undifferentiated
 * "Invalid request" tells them nothing.
 *
 * Zod issues carry field paths and constraint messages — facts about the
 * caller's own payload — not server internals, so including them leaks
 * nothing. Values are never echoed.
 */
export function badRequest(error: string, issues?: ZodIssue[]) {
  return NextResponse.json(
    {
      error,
      ...(issues?.length && {
        details: issues.slice(0, MAX_REPORTED_ISSUES).map((issue) => ({
          path: issue.path.join(".") || "(root)",
          message: issue.message,
        })),
      }),
    },
    { status: 400 },
  );
}

/**
 * Reads a JSON body without letting a parse failure become a 500.
 *
 * `request.json()` throws on malformed input, which is a client error; left to
 * the surrounding catch it would be reported as "Internal server error".
 */
export async function readJsonBody(
  request: NextRequest,
): Promise<{ ok: true; value: unknown } | { ok: false }> {
  try {
    return { ok: true, value: await request.json() };
  } catch {
    return { ok: false };
  }
}
