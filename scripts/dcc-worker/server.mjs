import { createServer } from "node:http";

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
        /^https?:\/\//.test(targetInput) &&
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
