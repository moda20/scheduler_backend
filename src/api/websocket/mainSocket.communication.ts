import { ElysiaWS } from "elysia/dist/ws";

import { JobNotificationTopics } from "@typesDef/api/websocket";
import currentRunsManager from "@utils/CurrentRunsManager";

export default function handleSocketMessage(message: any, ws: ElysiaWS<any>) {
  switch (message.id) {
    case JobNotificationTopics.Status: {
      ws.send({
        id: JobNotificationTopics.Status,
        data: JSON.stringify({
          runningJobCount: currentRunsManager.getRunningJobCount(),
        }),
      });
    }
  }
}
