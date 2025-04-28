import config from "@config/config";
import { prisma } from "@initialization/index";
import {
  deleteJobStartAndEndActions,
  registerJobStartAndEndActions,
  registerSingularJobStartAndEndActions,
  saveJobLogs,
  unsubscribeFromAllLogs,
} from "@initialization/jobsManager";
import {
  jobActions,
  jobAttributeMap,
  JobDTOClass,
  JobStats,
  jobStatus,
  jobUpdateConfig,
} from "@typesDef/models/job";
import currentRunsManager from "@utils/CurrentRunsManager";
import { lokiHttpService } from "@utils/httpRequestConfig";
import { findFiles, getNextJobExecution } from "@utils/jobUtils";
import logger from "@utils/loggers";
import dayjs from "dayjs";
import { join } from "path";
import manager from "schedule-manager";
import ScheduleJob from "schedule-manager/dist/Classes/Entities/ScheduleJob";
const { ScheduleJobManager } = manager;

export const getAllJobs = async ({
  limit,
  offset,
  name,
  status,
  sort,
}: {
  limit: number;
  offset: number;
  name: string;
  status: string[];
  sort: { id: string; desc: string }[];
}) => {
  const allJobs = await prisma.schedule_job.findMany({
    take: limit,
    skip: offset,
    where: {
      OR: [
        {
          job_name: {
            contains: name,
          },
        },
        {
          consumer: {
            contains: name,
          },
        },
      ],
      status: {
        in: status,
      },
    },
    orderBy: sort
      ?.filter((e) => jobAttributeMap[e.id])
      .map((e) => ({
        [jobAttributeMap[e.id]]: e.desc === "true" ? "desc" : "asc",
      })),
    include: {
      job_logs: {
        take: 1,
        orderBy: {
          start_time: "desc",
        },
      },
    },
  });
  const mappedJobs = allJobs.map((job) => {
    const nj = new JobDTOClass(job);
    nj.setInitialized(currentRunsManager.isInitialized(nj));
    nj.setIsCurrentlyRunning(currentRunsManager.isRunning(nj));
    nj.latestRun = nj.jobLogs?.[0];
    return nj;
  });
  const parsedSort = sort.reduce(
    (p, c) => {
      return { ...p, [c.id]: c.desc };
    },
    {} as Record<string, string>,
  );
  if (parsedSort?.cronSetting) {
    mappedJobs.sort((a, b) => {
      const nextA = getNextJobExecution(a.cronSetting);
      const nextB = getNextJobExecution(b.cronSetting);

      if (nextA && nextB) {
        return (
          (parsedSort?.cromSetting === "asc" ? -1 : 1) * nextA.getTime() -
          nextB.getTime()
        );
      }
      return 0;
    });
  }
  if (parsedSort?.running) {
    mappedJobs.sort((a, b) => {
      return (
        (parsedSort?.running === "asc" ? -1 : 1) *
        (Number(a.isCurrentlyRunning) - Number(b.isCurrentlyRunning))
      );
    });
  }
  return mappedJobs;
};

export const updateJobStatus = async (id: number, newStatus: string) => {
  const { job } = await ScheduleJobManager.getJobById(id);
  if (job) {
    job.setStatus(newStatus);
    return await ScheduleJobManager.updateJob(id, job);
  }
};

export const updateJobConfig = async (
  id: string,
  newConfig: jobUpdateConfig,
) => {
  const { job } = await ScheduleJobManager.getJobById(Number(id));
  if (job) {
    job.setCronSetting(newConfig.cronSetting ?? job?.getCronSetting());
    job.setName(newConfig.name ?? job?.getName());
    job.setParam(newConfig.param ?? job?.getParam());
    job.setConsumer(newConfig.consumer ?? job?.getConsumer());
    return await ScheduleJobManager.updateJob(Number(id), job);
  }
};

export const jobActionExecution = async (
  action: string,
  id: number,
  { config }: { config?: jobUpdateConfig },
) => {
  switch (action) {
    case jobActions.START: {
      return ScheduleJobManager.startJobById(id).then((d: any) => {
        if (d.success) {
          return ScheduleJobManager.getJobById(id)
            .then((jobDetails: any) => {
              registerJobStartAndEndActions(jobDetails.job);
              return Promise.resolve(true);
            })
            .then(() => updateJobStatus(id, "STARTED"));
        }
        throw new Error("Error when starting Job", {
          cause: d,
        });
      });
    }
    case jobActions.STOP: {
      // must stop logs event when stopping the cron job
      return Promise.resolve(ScheduleJobManager.stopJobById(id))
        .then(() => updateJobStatus(id, "STOPPED"))
        .then(() => unsubscribeFromAllLogs(id))
        .catch((err) => {
          logger.error(err);
          throw "Error when stopping Job";
        });
    }
    case jobActions.SOFT_DELETE: {
      return ScheduleJobManager.getJobById(id)
        .then((res) => {
          if (res.job) {
            return deleteJobStartAndEndActions(res.job);
          }
          throw new Error("Job not found", { cause: res });
        })
        .then(() => {
          return ScheduleJobManager.softDeleteJob(id).then(
            (d: { success: boolean }) => {
              if (d.success) {
                return d;
              } else {
                throw "Error when soft deleting Job";
              }
            },
          );
        });
    }
    case jobActions.CREATE: {
      if (!config) {
        throw "No config provided";
      }
      return ScheduleJobManager.newJob(
        config.name,
        config.cronSetting,
        config.param,
        config.consumer,
        true,
        jobStatus.STOPPED,
      ).then((d) => {
        if (d.success && d.job) {
          return registerJobStartAndEndActions(d.job);
        }
        throw new Error("Error when creating Job", {
          cause: d,
        });
      });
    }
    case jobActions.EXECUTE: {
      return ScheduleJobManager.jobRegistration(id, {
        singular: true,
      }).then((registrationData) => {
        if (!registrationData.success) {
          throw new Error("Error when registering job", {
            cause: registrationData,
          });
        }

        return ScheduleJobManager.getJobById(id).then((jobData) => {
          if (!jobData.job)
            throw new Error("Job not found", { cause: jobData });
          jobData.job.setUniqueSingularId(registrationData.uniqueSingularId!);
          registerSingularJobStartAndEndActions(jobData.job);
          saveJobLogs(
            registrationData.uniqueSingularId!,
            jobData.job?.getName(),
          );
          return registrationData;
        });
      });
    }
    case jobActions.UPDATE: {
      if (!config) {
        throw "No config provided";
      }
      return updateJobConfig(id.toString(), config);
    }
  }
};

export const getAvailableConsumers = async () => {
  const targetPath = join("src/jobs", config.get("jobs.targetFolderForJobs"));
  return findFiles(
    targetPath,
    config.get("jobs.jobsFileExtensions").split(","),
  );
};

export const isJobRunning = async (jobId: number) => {
  const { job } = await ScheduleJobManager.getJobById(jobId);
  if (job) {
    return currentRunsManager.isRunning(job);
  }
  return false;
};

export const getJobStats = async (startDate?: Date, endDate?: Date) => {
  const query = `
        SELECT DATE(start_time)                                                                                AS date,
               IFNULL(AVG(CASE WHEN end_time IS NOT NULL THEN TIMESTAMPDIFF(SECOND, start_time, end_time) ELSE 0 END),
                      0) / 60                                                                                  AS average_duration,
               SUM(CASE WHEN end_time IS NOT NULL THEN 1 ELSE 0 END)                                           AS total_runs,
               SUM(CASE WHEN end_time IS NOT NULL THEN TIMESTAMPDIFF(SECOND, start_time, end_time) ELSE 0
                   END) / 60                                                                                   AS total_runtime,
               SUM(CASE WHEN job_log_id LIKE '%singular%' THEN 1 ELSE 0 END)                                   AS singular_run_count,
               SUM(CASE WHEN error IS NOT NULL THEN 1 ELSE 0 END)                                          AS error_count
        FROM schedule_job_log
        ${startDate ? `WHERE start_time >= "${dayjs(startDate).format("YYYY-MM-DD HH:mm:ss")}"` : ""}
        ${endDate ? `AND start_time <= "${dayjs(endDate).format("YYYY-MM-DD HH:mm:ss")}"` : ""}
        GROUP BY date
        ORDER BY date;
    `;

  return prisma.$queryRawUnsafe<JobStats[]>(query);
};

export const getJobMetrics = async (jobIds?: number[]) => {
  const query = `
        SELECT
            COUNT(DISTINCT(job_id)) as job_count,
            SUM(CASE WHEN status = 'STARTED' THEN 1 ELSE 0 END) as running_jobs_count
        FROM schedule_job
                 ${jobIds ? `WHERE job_id IN (${jobIds?.map((e) => `'${e}'`).join(",")})` : ""}
    `;

  return prisma.$queryRawUnsafe<JobStats[]>(query);
};

export const getLokiLogs = (query: string, start?: number, end?: number) => {
  return lokiHttpService.get("/loki/api/v1/query_range", {
    params: {
      start,
      query,
      end,
      limit: 5000,
    },
  });
};

export const getRunningJobs = () => {
  return {
    count: currentRunsManager.getRunningJobCount(),
  };
};
