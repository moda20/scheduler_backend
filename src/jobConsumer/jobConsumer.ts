import config from "@config/config";
import * as BrowserlessService from "@external/browserless";
import { GotifyService } from "@notifications/gotify";
import { JobDTO, JobLogDTO, JobOptions } from "@typesDef/models/job";
import defaultAxiosInstance from "@utils/httpRequestConfig";
import * as jobConsumerUtils from "@utils/jobConsumerUtils";
import {
  exportCacheFiles,
  exportResultsToFile,
  getFromCache,
} from "@utils/jobUtils";
import { injectProxy } from "@utils/proxyUtils";
import type { AxiosInstance } from "axios";
import scheduleManager from "schedule-manager";
const { JobConsumer: Consumer } = scheduleManager;

export class JobConsumer extends Consumer {
  public axios: AxiosInstance;
  public options?: JobOptions;
  notification: GotifyService;
  public browserless: typeof BrowserlessService;
  constructor() {
    super();
    this.axios = defaultAxiosInstance.create();
    this.notification = new GotifyService();
    this.browserless = BrowserlessService;
  }

  getFromCache(...args: Parameters<typeof getFromCache>) {
    return getFromCache(...args);
  }

  exportResultsToFile(...args: Parameters<typeof exportResultsToFile>) {
    return exportResultsToFile(...args);
  }

  exportCacheFiles(...args: Parameters<typeof exportCacheFiles>) {
    return exportCacheFiles(...args);
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

  run(job: JobDTO, jobLog: JobLogDTO) {
    return super.run(job, jobLog);
  }

  async preRun(job: JobDTO, jobLog: JobLogDTO) {
    this.job = job;
    this.jobLog = jobLog;
    await this.injectProxies();
    try {
      this.options = {
        utils: jobConsumerUtils,
        config: config,
      };
      return await this.run(job, jobLog);
    } catch (err) {
      this.logEvent(`job ${job.name} crashed with an error ${err?.toString()}`);
      this.logEvent(err, (e) => this.serializeLogs(e, 10));
      this.error(err as Error);
      return await this.complete(jobLog, null, err?.toString());
    }
  }
}
