import config from "@config/config";
import {
  getConfigWithDBEncryptionStatus,
  ObjectifyFlattenedProperties,
} from "@config/config.service";
import { handleEvent } from "@repositories/notification";
import {
  getAllGlobalEventHandlers,
  getNotificationService,
} from "@repositories/notificationServices";
import {
  JobDTO,
  JobEventTypes,
  JobLogDTO,
  JobOptions,
} from "@typesDef/models/job";
import {
  DefaultNotificationService,
  JobEventHandlerConfig,
  jobEventNotificationConfigSchema,
  jobNotificationTypes,
  JobNotificationTypesType,
} from "@typesDef/notifications";
import defaultAxiosInstance from "@utils/httpRequestConfig";
import * as jobConsumerUtils from "@utils/jobConsumerUtils";
import {
  exportCacheFiles,
  exportResultsToFile,
  getFromCache,
  injectNotificationServices,
} from "@utils/jobUtils";
import { ProxyManager } from "@utils/proxyUtils";
import type { AxiosInstance } from "axios";
import scheduleManager, {
  IScheduleJob,
  IScheduleJobLog,
} from "schedule-manager";

const { JobConsumer: Consumer } = scheduleManager;

export class JobConsumer extends Consumer {
  public axios: AxiosInstance;
  public options?: JobOptions;
  notification: DefaultNotificationService;
  onEnd?: (job: IScheduleJob, jobLog: IScheduleJobLog) => Promise<void>;
  notificationServices: { [key: string]: any } = {};
  eventHandlers: Partial<{
    [key in JobNotificationTypesType]: JobEventHandlerConfig[];
  }> = {};
  proxyManager?: ProxyManager;
  constructor() {
    super();
    this.axios = defaultAxiosInstance.create();
    this.notification =
      new (jobConsumerUtils.getDefaultNotificationService() as new () => DefaultNotificationService)();
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

  private async initializeNotificationService(job: JobDTO, jobLog: JobLogDTO) {
    const targetNotificationService = await getNotificationService(
      0,
      this.notification.name,
    );
    if (!targetNotificationService) {
      this.emitWarning(
        `Notification service ==> ${this.notification.name} <== not found in db`,
      );
      throw new Error(
        `Notification service ==> ${this.notification.name} <== not found in db`,
      );
    }
    const serviceConfig = config.safeGet(
      `notifications.${this.notification.name}`,
      {},
    );
    this.notification.init(
      job,
      jobLog,
      targetNotificationService,
      serviceConfig,
    );
  }
  async injectNotificationServices(services: number[]) {
    this.notificationServices = await injectNotificationServices(
      this.job!,
      this.jobLog!,
      services,
      (v: any) => this.logEvent(v),
    );
    this.logEvent(
      `using ${Object.keys(this.notificationServices).length} notification services`,
    );
  }

  logEvent(data: any, serializer?: (data: any) => any) {
    let serializedData = serializer
      ? serializer(data)
      : this.serializeLogs(data);
    // a last stage stringification for logs for better readability
    serializedData =
      typeof serializedData === "object"
        ? JSON.stringify(serializedData, null, 4)
        : serializedData;
    if (this.jobLog?.logEventBus) {
      this.jobLog.logEventBus.emit(
        "jobLog:" + (this.job?.getUniqueSingularId() ?? this.job?.getId()),
        {
          logId: this.jobLog?.getId(),
          data: serializedData,
        },
      );
    }
  }

  emitError(error: any) {
    return jobConsumerUtils.emitJobEvent(
      "JOB_ERROR",
      error,
      JobEventTypes.ERROR,
      this.jobLog!.getId()!,
      this.job!.getId()!,
      this.eventHandlers[jobNotificationTypes.JOB_EVENT_ERROR],
    );
  }

  emitWarning(warning: any) {
    return jobConsumerUtils.emitJobEvent(
      "JOB_WARNING",
      warning,
      JobEventTypes.WARNING,
      this.jobLog!.getId()!,
      this.job!.getId()!,
      this.eventHandlers[jobNotificationTypes.JOB_EVENT_WARNING],
    );
  }

  emitInfo(info: any) {
    return jobConsumerUtils.emitJobEvent(
      "JOB_INFO",
      info,
      JobEventTypes.INFO,
      this.jobLog!.getId()!,
      this.job!.getId()!,
      this.eventHandlers[jobNotificationTypes.JOB_EVENT_INFO],
    );
  }

  jobInputParse(job: JobDTO, jobLog: JobLogDTO) {
    if (job.param && typeof job.param === "string") {
      job.param = JSON.parse(job.param);
      if (job.extraParams) {
        job.param = {
          ...job.param,
          ...job.extraParams,
        };
      }
    }
    return {
      job,
      jobLog,
    };
  }

  injectEventHandlers(job: JobDTO, jobLog: JobLogDTO) {
    const handlerConfigs = job.param?.eventHandlers;
    const globalHandlers = getAllGlobalEventHandlers();
    const allHandlers = [];
    if (Object.keys(globalHandlers).length) {
      allHandlers.push(...Object.values(globalHandlers));
    }
    if (Array.isArray(handlerConfigs) && handlerConfigs?.length) {
      allHandlers.push(...handlerConfigs);
    } else {
      this.logEvent(
        "No job event handlers found for this job, skipping injection",
      );
    }

    if (allHandlers.length) {
      const configs = allHandlers.map((cfg: any) => {
        const parsedConfig = jobEventNotificationConfigSchema.parse(cfg);
        return {
          job,
          jobLog,
          ...parsedConfig,
        };
      });
      this.eventHandlers = configs.reduce(
        (p: any, c: JobEventHandlerConfig) => {
          c.notification_type.forEach((nt_type: string) => {
            if (p[nt_type]) {
              p[nt_type].push(c);
            } else {
              p[nt_type] = [c];
            }
          });
          return p;
        },
        {} as { [key: string]: JobEventHandlerConfig[] },
      );
    }
  }

  async preRun(j: JobDTO, jl: JobLogDTO) {
    const { job, jobLog } = this.jobInputParse(j, jl);
    this.job = job;
    this.jobLog = jobLog;
    const proxyConfig = job.param?.proxyConfig;
    // Setting the object proxyManager to a new manager for each run, can cause issues for overlapping cron based runs
    // when proxies change between the execution time (based on random or least X strategy, or if the proxies linked change)
    // This is due to the fact that for cron based runs we use a singular instance of the consumer.
    // IF this can create issues for your consumer scripts, it's better to use a new axios instance that you control in your own code
    // and assign proxies ot it using the general manager.

    // if there is case where there is an existing proxyManager in this instance, the previous one will have it's axios interceptors
    // cleared
    if (this.proxyManager) {
      this.proxyManager.clearInterceptors();
    }
    this.proxyManager = new ProxyManager({
      jobId: job.id!,
      defaultAxiosInstance: this.axios,
      proxyStrategy: proxyConfig?.proxyStrategy,
      targetProxyId: proxyConfig?.targetProxyId,
      logger: (v) => this.logEvent(v),
    });
    await this.proxyManager.injectProxies().catch((err) => {
      this.logEvent("error injecting proxies, proceeding without proxies");
      this.logEvent(err);
    });

    // initializing the notification service to work with the new structure of services
    await this.initializeNotificationService(job, jobLog);
    try {
      this.options = {
        utils: jobConsumerUtils,
        config: ObjectifyFlattenedProperties(
          await getConfigWithDBEncryptionStatus({
            encryptedValues: false,
            withJobHiddenProperties: false,
            onlyMirroredValues: false,
            returnNotificationServiceConfig: true,
          }),
          (v) => v?.value ?? v,
        ),
      };
      await this.injectNotificationServices(
        job?.param?.notificationServices || [],
      );
      // initializing event handlers
      await this.injectEventHandlers(job, jobLog);
      const completedResults = await this.run(job, jobLog);
      if (!completedResults.success) {
        this.emitError(
          `Job didn't complete correctly: ${JSON.stringify(completedResults)}`,
        );
      }
      return completedResults;
    } catch (err) {
      this.logEvent(`job ${job.name} crashed with an error ${err?.toString()}`);
      this.logEvent(err, (e) => this.serializeLogs(e, 10));
      this.error(err as Error);
      return await this.complete(jobLog, null, err?.toString());
    }
  }

  async complete(jobLog: IScheduleJobLog, result: any, error?: string) {
    if (this.onEnd) {
      await this.onEnd(this.job!, jobLog);
    }
    const completionResults: any = await super.complete(jobLog, result, error);
    if (this.eventHandlers) {
      this.eventHandlers[jobNotificationTypes.JOB_DURATION]?.forEach(
        (handlerConfig: JobEventHandlerConfig) => {
          return handleEvent(
            handlerConfig,
            undefined,
            completionResults.newTimeInSeconds,
          );
        },
      );
    }
    return completionResults;
  }
}
