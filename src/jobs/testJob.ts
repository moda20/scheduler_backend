import { JobConsumer } from "@jobConsumer/jobConsumer";
import { JobDTO, JobLogDTO, JobOptions } from "@typesDef/models/job";

class TestJob extends JobConsumer {
  constructor() {
    super();
  }

  async run(job: JobDTO, jobLog: JobLogDTO, options: JobOptions) {
    console.log("running test job");
    this.logEvent("You are running the test job");
    console.log(options);
    await this.exportResultsToFile({
      job_log_id: jobLog.id,
      fileName: "test",
      results: { test: "test" },
    });
    await this.exportCacheFiles({
      job_log_id: jobLog.id,
      fileName: "test",
      results: { test: "test" },
      newFile: true,
    });
    return this.complete(jobLog, "");
  }
}

export default new TestJob();
