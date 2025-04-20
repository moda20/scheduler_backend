import config from "@config/config";
import { Notifications } from "@typesDef/notifications";
import { GotifyHttpService } from "@utils/httpRequestConfig";
import logger from "@utils/loggers";

export class GotifyService implements Notifications {
  sendJobFinishNotification(
    jobId: string,
    jobName: string,
    results: string,
    options?: { title: string; message: string; priority: number },
  ) {
    const url = config.get("gotify.url");
    const token = config.get("gotify.token");
    if (!url || !token) {
      logger.error("Gotify Is not configured to use");
      return Promise.resolve();
    }
    const { title, message, priority } = options ?? {};
    const urlEncodedResults = encodeURIComponent(results);
    return GotifyHttpService.post("/message", {
      message:
        message ?? `Job ${jobName} finished with results: ${urlEncodedResults}`,
      priority: priority ?? 1,
      title: title ?? `Job ${jobName}${jobId && ` ${jobId} `}finished`,
    }) as Promise<any>;
  }

  sendJobCrashNotification(
    jobId: string,
    jobName: string,
    error?: string,
    options?: { title: string; message: string; priority: number },
  ): Promise<any> {
    const url = config.get("gotify.url");
    const token = config.get("gotify.token");
    if (!url || !token) {
      logger.error("Gotify Is not configured to use");
      return Promise.resolve();
    }
    const { title, message, priority } = options ?? {};
    return GotifyHttpService.post(
      "/message",
      {
        message: message ?? `Job ${jobName} crashed with error: ${error}`,
        priority: priority ?? 1,
        title: title ?? `Job ${jobName}${jobId && ` ${jobId} `} Crashed`,
      },
      {
        params: {
          token: config.get("gotify.appErrorChannelToken"),
        },
      },
    ) as Promise<any>;
  }
}
