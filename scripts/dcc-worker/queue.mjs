/**
 * A FIFO job queue that processes one job at a time — deliberately
 * single-concurrency, since a local qwen brain run is compute-heavy and
 * this runs on a shared research machine.
 */
export class JobQueue {
  /**
   * @param {{
   *   runJob: (job: {crawlRequestId: string, targetInput: string, description: string}) => Promise<{status: string, error?: string, traceDir: string}>,
   *   postCompletion: (job: {crawlRequestId: string, targetInput: string, description: string}, result: {status: string, error?: string, traceDir: string}) => Promise<void>,
   *   onError?: (job: {crawlRequestId: string, targetInput: string, description: string}, err: unknown) => void,
   * }} deps
   */
  constructor(deps) {
    this.runJob = deps.runJob;
    this.postCompletion = deps.postCompletion;
    this.onError = deps.onError ?? (() => {});
    this.pending = [];
    this.processing = false;
  }

  /**
   * @param {{crawlRequestId: string, targetInput: string, description: string}} job
   */
  enqueue(job) {
    this.pending.push(job);
    this._drain();
  }

  async _drain() {
    if (this.processing) return;
    this.processing = true;
    while (this.pending.length > 0) {
      const job = this.pending.shift();
      try {
        const result = await this.runJob(job);
        await this.postCompletion(job, result);
      } catch (err) {
        this.onError(job, err);
      }
    }
    this.processing = false;
  }
}
