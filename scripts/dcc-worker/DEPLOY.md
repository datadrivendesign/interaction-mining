# Deploying dcc-worker on D3PO

`dcc-worker` bridges interaction-mining's Capture Trace requests to a real
`dcc run` on D3PO. It never modifies the `dcc` repo — it only invokes its
built CLI as a subprocess.

## Prerequisites

1. `dcc` cloned and built on D3PO:
   ```bash
   git clone <dcc repo url> ~/dcc
   cd ~/dcc
   pnpm install
   pnpm -r build
   ```
   Confirm `~/dcc/cli/dist/cli.js` exists.

2. Ollama running on D3PO with the qwen model pulled (matches `dcc run
   --brain qwen`'s local-first default):
   ```bash
   ollama pull qwen3.6:27b
   ```

3. Node 20+ available on D3PO (no other dependencies — `dcc-worker` uses
   only Node built-ins).

4. `pm2` for process management (installed without root, e.g. via a
   user-local npm prefix or `npx pm2`).

## Deploy

```bash
# From this repo, on your machine:
scp -r scripts/dcc-worker d3po:~/dcc-worker

# On D3PO:
cd ~/dcc-worker
export DCC_CLI_PATH=$HOME/dcc/cli/dist/cli.js
export DCC_AUTH_TOKEN=<generate a long random secret, share it with whoever sets DCC_AUTH_TOKEN on the interaction-mining side>
export CALLBACK_BASE_URL=<the interaction-mining deployment's base URL, e.g. https://odim.example.edu>
export PORT=5050   # matches the LocalForward 5050 already in dev ~/.ssh/config for d3po

pm2 start index.mjs --name dcc-worker \
  --env DCC_CLI_PATH="$DCC_CLI_PATH" \
  --env DCC_AUTH_TOKEN="$DCC_AUTH_TOKEN" \
  --env CALLBACK_BASE_URL="$CALLBACK_BASE_URL" \
  --env PORT="$PORT"

pm2 save   # persist across D3PO reboots (with pm2 startup configured once)
```

## Verify

```bash
curl http://localhost:5050/health
# {"ok":true}
```

From a machine that can reach D3PO on port 5050 (open the port, or keep
using an SSH LocalForward for now):

```bash
curl -X POST http://d3po.cs.illinois.edu:5050/dispatch \
  -H "Authorization: Bearer $DCC_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"crawlRequestId":"smoketest","targetInput":"https://example.com","description":"find the pricing page"}'
# {"accepted":true}
```

Then check `~/.dcc/traces/crawl-smoketest/result.json` on D3PO once the run
finishes, and confirm interaction-mining's `/api/crawl-requests/smoketest/complete`
received the callback (note: a real `crawlRequestId` must exist in the
database for the callback to update anything — the raw dispatch above is
just to confirm the worker itself runs end-to-end).

## Known limitations (v1)

- In-memory queue only — a `dcc-worker` restart drops any queued/in-flight
  job. The corresponding `CrawlRequest` stays at `DISPATCHED` with no
  automatic recovery; needs manual follow-up.
- Single concurrency — one `dcc run` at a time, by design (shared compute).
- No TLS/reverse proxy in front of this yet — plaintext HTTP secured only
  by the bearer token. Fine for a first working version; revisit before
  wider exposure.
