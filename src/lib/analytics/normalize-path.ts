/**
 * Strips record identifiers out of a URL path before it reaches Google Analytics.
 *
 * GA attaches `page_location` to every hit, taken from `window.location`. On
 * this app that means a URL like `/capture/0123456789abcdef01234567/upload`,
 * which sends a capture's MongoDB ObjectId to a third party on every pageview
 * and every event. That id joins to a worker through our own database, so it is
 * participant-identifying even though Google cannot resolve it alone.
 *
 * Replacing the id keeps route-level analytics — `/capture/[id]/upload` still
 * aggregates correctly — while the identifier never leaves. Capture-level
 * attribution is unaffected: S3 server access logs carry the object key
 * (`uploads/{captureId}/…`), which stays inside our own infrastructure.
 *
 * Matches any 24-character hex path segment, so it covers capture, trace, app
 * and task ids without needing a list of routes.
 */
const OBJECT_ID_SEGMENT = /\/[0-9a-f]{24}(?=\/|$)/gi;

export const REDACTED_ID = "/[id]";

/**
 * @param pathname A URL path, e.g. `/capture/0123456789abcdef01234567/upload`.
 * @returns The same path with ObjectId segments replaced, e.g.
 *   `/capture/[id]/upload`.
 */
export function normalizeAnalyticsPath(pathname: string): string {
  return pathname.replace(OBJECT_ID_SEGMENT, REDACTED_ID);
}

/**
 * Inline script that applies the same redaction before GA initialises.
 *
 * `@next/third-parties` emits a bare `gtag('config', id)`, which immediately
 * sends a `page_view` using the raw URL. Setting `page_location` from a React
 * effect would therefore run too late and leak the first hit. This seeds the
 * same `dataLayer` queue with a `set` command first; gtag.js processes the
 * queue in order once it loads, so the redacted value is already in effect.
 *
 * The regex is duplicated here as a string rather than imported because this
 * runs as raw browser JS before any bundle is evaluated. `normalizeAnalyticsPath`
 * above is the tested definition; keep the two in step.
 */
export const GA_PATH_REDACTION_SCRIPT = `
(function () {
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  var path = location.pathname.replace(/\\/[0-9a-f]{24}(?=\\/|$)/gi, '${REDACTED_ID}');
  gtag('set', {
    page_location: location.origin + path + location.search,
    page_path: path,
  });
})();
`.trim();
