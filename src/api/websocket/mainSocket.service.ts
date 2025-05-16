import { ElysiaWS } from "elysia/dist/ws";

import { JobNotificationTopics } from "@typesDef/api/websocket";
import { JobDTO } from "@typesDef/models/job";

export default {
  clients: {} as { [key: string]: ElysiaWS<any> },
  socket: null,
  setWsClient(client: any, userId: string) {
    this.clients[userId] = client;
    this.socket = client;
  },
  broadcastMessage(message: any) {
    Object.values(this.clients).forEach((e) => {
      e?.send(message);
    });
  },
  sendJobStartingNotification(job: JobDTO, runningJobCount: number) {
    this.broadcastMessage({
      id: JobNotificationTopics.JobStarted,
      data: JSON.stringify({
        message: "Job started",
        jobId: job.id,
        jobName: job.name,
        runningJobCount: runningJobCount,
        isSingular: !!job.getUniqueSingularId(),
        averageTime: job.averageTime,
      }),
    });
  },
  sendJobEndingNotification(job: JobDTO, runningJobCount: number) {
    this.broadcastMessage({
      id: JobNotificationTopics.JobFinished,
      data: JSON.stringify({
        message: "Job finished",
        jobId: job.id,
        jobName: job.name,
        runningJobCount: runningJobCount,
        isSingular: !!job.getUniqueSingularId(),
        averageTime: job.averageTime,
      }),
    });
  },
};
