import { createServer } from "node:http";

/**
 * Rejects literal loopback/private IPs and well-known internal hostnames.
 *
 * NOTE: this is a literal string check only — it does not resolve DNS, so a
 * hostname that *resolves* to a private address at request time (DNS
 * rebinding) is not caught here. Closing that gap would require a
 * resolve-then-check approach; out of scope for now.
 *
 * @param {string} hostname
 * @returns {boolean}
 */
export function isPrivateOrLoopbackHost(hostname) {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
    return true;
  }
  return (
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
    /^169\.254\./.test(host)
  );
}

/**
 * Validates that targetInput is an http(s) URL that isn't a Play Store
 * listing (V1 handles URL targets only) and isn't targeting private/internal
 * address space.
 * @param {string} targetInput
 * @returns {boolean}
 */
function isDispatchableTarget(targetInput) {
  let url;
  try {
    url = new URL(targetInput);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return false;
  }
  if (url.hostname.toLowerCase() === "play.google.com") {
    return false;
  }
  if (isPrivateOrLoopbackHost(url.hostname)) {
    return false;
  }
  return true;
}

/**
 * @param {{
 *   authToken: string,
 *   enqueue: (job: {crawlRequestId: string, targetInput: string, description: string}) => void,
 * }} deps
 * @returns {import("node:http").Server}
 */
export function createDccWorkerServer(deps) {
  return createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (req.method === "POST" && req.url === "/dispatch") {
      const authHeader = req.headers["authorization"];
      if (authHeader !== `Bearer ${deps.authToken}`) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Unauthorized" }));
        return;
      }

      let body = "";
      for await (const chunk of req) body += chunk;

      let payload;
      try {
        payload = JSON.parse(body);
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
        return;
      }

      const { crawlRequestId, targetInput, description } = payload ?? {};
      const isValid =
        typeof crawlRequestId === "string" &&
        crawlRequestId.length > 0 &&
        typeof targetInput === "string" &&
        isDispatchableTarget(targetInput) &&
        typeof description === "string" &&
        description.length > 0;

      if (!isValid) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid dispatch payload" }));
        return;
      }

      deps.enqueue({ crawlRequestId, targetInput, description });
      res.writeHead(202, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ accepted: true }));
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  });
}
