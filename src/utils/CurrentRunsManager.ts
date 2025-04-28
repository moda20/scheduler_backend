import { JobDTO } from "@typesDef/models/job";
export default {
  runningJobs: <Record<string, Record<string, JobDTO>>>{},
  initialized: <Record<string, boolean>>{},
  startJob(job: JobDTO) {
    if (this.runningJobs[job.getName()]) {
      this.runningJobs[job.getName()][
        job.getUniqueSingularId() ?? job.getId()!
      ] = job;
    } else {
      this.runningJobs[job.getName()] = {
        [job.getUniqueSingularId() ?? job.getId()!]: job,
      };
    }
  },
  endJob(job: JobDTO) {
    if (this.runningJobs[job.getName()]) {
      delete this.runningJobs[job.getName()][
        job.getUniqueSingularId() ?? job.getId()!
      ];
      if (Object.keys(this.runningJobs[job.getName()]).length === 0) {
        delete this.runningJobs[job.getName()];
      }
    }
  },
  isRunning(job: JobDTO): boolean {
    return !!this.runningJobs[job.getName()];
  },
  isInitialized(job: JobDTO): boolean {
    return !!this.initialized[job.getName()];
  },
  getRunningJobCount() {
    return Object.values(this.runningJobs).filter(
      (e) => Object.values(e).length > 0,
    ).length;
  },
};
