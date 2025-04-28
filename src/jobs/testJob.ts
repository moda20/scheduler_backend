import { JobConsumer } from "@jobConsumer/jobConsumer";
import { JobDTO, JobLogDTO, JobOptions } from "@typesDef/models/job";

class TestJob extends JobConsumer {
  constructor() {
    super();
  }

  async run(job: JobDTO, jobLog: JobLogDTO, options: JobOptions) {
    this.logEvent("You are running the test job");
    this.logEvent("will sleep");
    await this.options?.utils?.sleep(10);
    this.logEvent("finished sleeping");
    await this.exportResultsToFile({
      job_log_id: jobLog.id,
      fileName: "test",
      results: { test: "test" },
    });
    await this.exportCacheFiles({
      job_log_id: jobLog.id,
      fileName: "test",
      data: { test: "test" },
      newFile: true,
    });
    this.logEvent("Testing Final Log");
    return this.complete(jobLog, "");
  }
}

export default new TestJob();
