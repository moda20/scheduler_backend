import config from "@config/config";
import { JobDTO, JobLogDTO, JobOptions } from "@typesDef/models/job";
import defaultAxiosInstance from "@utils/httpRequestConfig";
import * as jobConsumerUtils from "@utils/jobConsumerUtils";
import { exportCacheFiles, exportResultsToFile } from "@utils/jobUtils";
import { injectProxy } from "@utils/proxyUtils";
import type { AxiosInstance } from "axios";
import scheduleManager from "schedule-manager";
const { JobConsumer: Consumer } = scheduleManager;

export class JobConsumer extends Consumer {
  private axios: AxiosInstance;
  private options: JobOptions | undefined;
  exportResultsToFile = exportResultsToFile;
  exportCacheFiles = exportCacheFiles;
  constructor() {
    super();
    this.axios = defaultAxiosInstance.create();
  }

  async injectProxies() {
    return injectProxy({
      jobId: Number(this.job?.id),
      axiosInstance: this.axios,
      logger: this.logEvent,
    })
      .then((proxy) => {
        if (proxy) {
          this.logEvent(`proxy ${proxy.proxy_ip}:${proxy.proxy_port} injected`);
        } else {
          this.logEvent("no proxy to inject found");
        }
      })
      .catch((err) => {
        this.logEvent("error injecting proxies");
        this.logEvent(err);
      });
  }

  run(job: JobDTO, jobLog: JobLogDTO, options?: JobOptions) {
    this.options = options;
    return super.run(job, jobLog);
  }

  async preRun(job: JobDTO, jobLog: JobLogDTO) {
    this.job = job;
    this.jobLog = jobLog;
    await this.injectProxies();
    try {
      return await this.run(job, jobLog, {
        utils: jobConsumerUtils,
        config: config,
      });
    } catch (err) {
      this.logEvent(`job ${job.name} crashed with an error ${err?.toString()}`);
      this.logEvent(err, (e) => this.serializeLogs(e, 10));
      this.error(err as Error);
      return await this.complete(jobLog, null, err?.toString());
    }
  }
}
