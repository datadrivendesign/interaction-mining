import { runJob } from "./job-runner.mjs";
import { postCompletion } from "./callback.mjs";
import { JobQueue } from "./queue.mjs";
import { createDccWorkerServer } from "./server.mjs";

const PORT = Number(process.env.PORT ?? 5050);
const DCC_CLI_PATH = process.env.DCC_CLI_PATH;
const DCC_AUTH_TOKEN = process.env.DCC_AUTH_TOKEN;
const CALLBACK_BASE_URL = process.env.CALLBACK_BASE_URL;
const TRACE_ROOT = process.env.DCC_TRACE_ROOT ?? `${process.env.HOME}/.dcc/traces`;

for (const [name, value] of Object.entries({ DCC_CLI_PATH, DCC_AUTH_TOKEN, CALLBACK_BASE_URL })) {
  if (!value) {
    console.error(`dcc-worker: missing required env var ${name}`);
    process.exit(1);
  }
}

const queue = new JobQueue({
  runJob: (job) => runJob(job, { dccCliPath: DCC_CLI_PATH, traceRoot: TRACE_ROOT }),
  postCompletion: (job, result) =>
    postCompletion(job, result, { callbackBaseUrl: CALLBACK_BASE_URL, authToken: DCC_AUTH_TOKEN }),
  onError: (job, err) => {
    console.error(`dcc-worker: job ${job.crawlRequestId} failed`, err);
  },
});

const server = createDccWorkerServer({
  authToken: DCC_AUTH_TOKEN,
  enqueue: (job) => queue.enqueue(job),
});

server.listen(PORT, () => {
  console.log(`dcc-worker listening on :${PORT}`);
});
