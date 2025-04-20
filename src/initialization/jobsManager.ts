import { JobConsumer } from "@jobConsumer/jobConsumer";
import { JobDTO, jobStatus } from "@typesDef/models/job";
import currentRunsManager from "@utils/CurrentRunsManager";
import logger, { JobLogger } from "@utils/loggers";
import schedulerManager from "schedule-manager";
const { ScheduleJobEventBus, ScheduleJobLogEventBus, ScheduleJobManager } =
  schedulerManager;

const startAllJobs = () => {
  return ScheduleJobManager.getJobsByStatus(["STOPPED", "STARTED"]).then(
    ({ jobs, err }) => {
      if (!jobs) {
        throw new Error("No jobs found", {
          cause: err,
        });
      }
      const jobStats = {
        startedJobs: 0,
        foundJobs: 0,
        errorStartingJobs: 0,
      };
      return Promise.all(
        jobs.map((job) => {
          jobStats.foundJobs++;
          if (job.getStats() === jobStatus.STARTED) {
            return ScheduleJobManager.startJobById(job.getId()!)
              .then((d: { success: boolean }) => {
                if (d.success && job.getId()) {
                  registerJobStartAndEndActions(job);
                  return saveJobLogs(
                    job.getId()!.toString(),
                    job.getName(),
                  ).then(() => d);
                } else {
                  logger.error("Error when starting Job");
                  logger.error(d);
                  jobStats.errorStartingJobs++;
                  return d;
                }
              })
              .then((jobStatus) => {
                if (jobStatus.success) {
                  jobStats.startedJobs++;
                }
                return jobStatus;
              });
          } else {
            return Promise.resolve({
              name: job.name,
              result: null,
            });
          }
        }),
      ).then((jobResults) => {
        return {
          stats: jobStats,
          results: jobResults,
        };
      });
    },
  );
};

export const registerJobStartAndEndActions = (job: JobDTO) => {
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

export const unsubscribeFromAllLogs = (id: number) => {
  ScheduleJobLogEventBus.removeAllListeners(id.toString());
  return { success: true };
};

export const deleteJobStartAndEndActions = (job: JobDTO) => {
  if (currentRunsManager.initialized[job.getName()]) {
    ScheduleJobEventBus.off(
      "scheduleJob:" + job.getName(),
      (startedJob: JobDTO) => {
        currentRunsManager.startJob(startedJob);
      },
    );
    ScheduleJobEventBus.off(
      "completed:" + job.getName(),
      (endedJob: JobDTO) => {
        currentRunsManager.endJob(endedJob);
      },
    );
    delete currentRunsManager.initialized[job.getName()];
  }
};

export const saveJobLogs = (id: string, name: string) => {
  try {
    const logId = "jobLog:" + id;
    const errorId = "error:" + id;
    ScheduleJobLogEventBus.removeAllListeners(logId);
    ScheduleJobLogEventBus.removeAllListeners(errorId);
    ScheduleJobLogEventBus.on(logId, (data: any) => {
      JobLogger(id.toString(), name).info(data);
    });
    ScheduleJobLogEventBus.on(errorId, (data: any) => {
      JobLogger(id.toString(), name).info(data);
      const targetConsumer = ScheduleJobManager.runningJob.find(
        (j) =>
          (j.job.getUniqueSingularId() ?? j.job.getId())?.toString() === id,
      )?.consumer as JobConsumer;
      targetConsumer?.notification?.sendJobCrashNotification(
        id,
        name,
        data?.toString(),
      );
    });
    return Promise.resolve(true);
  } catch (err) {
    logger.error("error subscribing to logs for saving");
    logger.error(err);
    return Promise.reject(err);
  }
};

export { startAllJobs };
