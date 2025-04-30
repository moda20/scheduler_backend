import { t } from "elysia";

import socketService from "@api/websocket/mainSocket.service";
import { isAuthenticated } from "@auth/guards/authenticated.guard";
import { JobNotificationTopics } from "@typesDef/api/websocket";
import { createElysia } from "@utils/createElysia";

export const websocketController = createElysia().ws("/ws", {
  body: t.Object({
    message: t.String(),
  }),
  message(ws, { message }) {
    console.log("message received", message);
    ws.send(JobNotificationTopics.NOOP);
  },
  error(error: any) {
    console.log(error);
  },
  open(ws: any) {
    if (!ws.data.set.headers["x-user-id"]) {
      ws.send("Missing userId in query");
      ws.close(401);
      return;
    }
    socketService.setWsClient(ws, ws.data.headers["x-user-id"]);
  },
  async beforeHandle({ set, jwtAccess, cookie }) {
    const isAuth = await isAuthenticated(jwtAccess, cookie);
    if (!isAuth.success) {
      set.status = 401;
      return {
        success: false,
        message: isAuth.message,
        errors: isAuth.errors,
      };
    }
    set.headers["x-user-id"] = isAuth.data.id || "";
  },
});
