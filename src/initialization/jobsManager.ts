// @ts-ignore
import { ScheduleJobManager, ScheduleJobLogEventBus } from "schedule-manager";
import currentRunsManager from "@utils/CurrentRunsManager";
import { JobDTO } from "@typesDef/models/job";
import logger, {JobLogger} from "@utils/loggers";

const startAllJobs = (): Promise<{ success: boolean }> => {
  return ScheduleJobManager.getJobsByStatus(["STOPPED", "STARTED"]).then(
    ({ result, jobs }: { result: any; jobs: JobDTO[] }) => Promise.all(
        jobs.map((job: JobDTO) => {
          ScheduleJobManager.startJobById(job.getId()).then(
            (d: { success: boolean }) => {
              if (d.success) {
                registerJobStartAndEndActions(job);
                return saveJobLogs(job.getId(), job.getName()).then(() => d)
              } else {
                logger.error("Error when starting Job");
                logger.error(d);
              }
            },
          );
        })
      )
  );
};

const registerJobStartAndEndActions = (job: JobDTO) => {
  logger.info(`Registering jobs ${job.getName()}`);
  if (currentRunsManager.initialized[job.getName()]) {
    return; // Already initialized;
  }
  ScheduleJobLogEventBus.on(
    "scheduleJob:" + job.getName(),
    (startedJob: JobDTO) => {
      currentRunsManager.startJob(startedJob);
    },
  );
  ScheduleJobLogEventBus.on(
    "completed:" + job.getName(),
    (endedJob: JobDTO) => {
      currentRunsManager.endJob(endedJob);
    },
  );
  currentRunsManager.initialized[job.getName()] = true;
};

const saveJobLogs = (id: string, name: string) => {
  try {
    const logId = "jobLog:" + uniqueId
    const errorId = "error:" + uniqueId
    ScheduleJobLogEventBus.removeAllListeners(logId)
    ScheduleJobLogEventBus.removeAllListeners(errorId)
    ScheduleJobLogEventBus.on(logId, (data) => {
      JobLogger(uniqueId, name).info(data)
    })
    ScheduleJobLogEventBus.on(errorId, (data) => {
      JobLogger(uniqueId, name).info(data)
      //notifyOfJobCrash(name, data?.toString()) TODO implement crash notification
    })
    return Promise.resolve(true)
  } catch (err) {
    logger.error("error subscribing to logs for saving")
    logger.error(err);
    return Promise.reject(new Error(err))
  }
}

export { startAllJobs };
