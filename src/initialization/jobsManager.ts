// @ts-ignore
import { ScheduleJobManager, ScheduleJobLogEventBus } from "schedule-manager";
import currentRunsManager from "@utils/CurrentRunsManager";
import { JobDTO } from "@typesDef/models/job";

const startAllJobs = (): Promise<{ success: boolean }> => {
  return ScheduleJobManager.getJobsByStatus(["STOPPED", "STARTED"]).then(
    ({ result, jobs }: { result: any; jobs: JobDTO[] }) => {
      jobs.forEach((job: JobDTO) => {
        registerJobStartAndEndActions(job);
        ScheduleJobManager.startJobById(job.getId()).then(
          (d: { success: boolean }) => {
            if (d.success) {
              console.log("Job started");
              return d;
            } else {
              console.log("Error when starting Job");
              console.log(d);
            }
          },
        );
      });
    },
  );
};

const registerJobStartAndEndActions = (job: JobDTO) => {
  console.log("Registering jobs", job.getName());
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

export { startAllJobs };
