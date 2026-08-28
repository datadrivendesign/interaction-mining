/**
 * Posts a job's outcome back to interaction-mining's completion route,
 * retrying transient failures a few times before giving up.
 * @param {{crawlRequestId: string}} job
 * @param {{status: string, error?: string, traceDir: string}} result
 * @param {{
 *   callbackBaseUrl: string,
 *   authToken: string,
 *   fetchFn?: typeof fetch,
 *   retries?: number,
 *   retryDelayMs?: number,
 * }} opts
 * @returns {Promise<void>}
 */
export async function postCompletion(job, result, opts) {
  const fetchFn = opts.fetchFn ?? fetch;
  const retries = opts.retries ?? 3;
  const retryDelayMs = opts.retryDelayMs ?? 1000;
  const url = `${opts.callbackBaseUrl}/api/crawl-requests/${job.crawlRequestId}/complete`;

  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetchFn(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${opts.authToken}`,
        },
        body: JSON.stringify(result),
      });
      if (res.ok) return;
      lastErr = new Error(`completion callback responded ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }
  throw lastErr;
}
