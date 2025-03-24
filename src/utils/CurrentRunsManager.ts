import { JobDTO } from "@typesDef/models/job";
export default {
  runningJobs: <Record<string, Record<string, JobDTO>>>{},
  initialized: <Record<string, boolean>>{},
  startJob(job: JobDTO) {
    console.log("starting job", job.getName());
    if (this.runningJobs[job.getName()]) {
      this.runningJobs[job.getName()][
        job.getUniqueSingularId() ?? job.getId()
      ] = job;
    } else {
      this.runningJobs[job.getName()] = {
        [job.getUniqueSingularId() ?? job.getId()]: job,
      };
    }
  },
  endJob(job: JobDTO) {
    if (this.runningJobs[job.getName()]) {
      delete this.runningJobs[job.getName()][
        job.getUniqueSingularId() ?? job.getId()
      ];
    }
  },
  isRunning(job: JobDTO) {
    if (!this.runningJobs[job.getName()]) return false;
    return this.runningJobs[job.getName()];
  },
  getRunningJobCount() {
    return {
      runningJobsCount: Object.values(this.runningJobs).filter(
        (e) => Object.values(e).length > 0,
      ).length,
    };
  },
};
