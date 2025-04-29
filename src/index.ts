import { Elysia, HTTPMethod } from "elysia";
import { helmet } from "elysia-helmet";
import cookie from "@elysiajs/cookie";
import { cors } from "@elysiajs/cors";

import { apiRoutes } from "@api/index";
import { auth } from "@auth/auth.controller";
import { jwtAccessSetup, jwtRefreshSetup } from "@auth/guards/setup.jwt";
import config from "@config/config";
import logger from "@utils/loggers";

import { initialize } from "./initialization";

const api = new Elysia();

// Setup

api.use(jwtAccessSetup).use(jwtRefreshSetup).use(cookie());

//Security;
api.use(
  cors({
    origin: () => true,
    credentials: true,
    exposedHeaders: "*",
    allowedHeaders: ["content-type"],
    // @ts-ignore
    methods: (process.env.CORS_ALLOWED_METHODS! as HTTPMethod) || "*",
  }),
);
api.use(helmet());

// Routes
api.use(auth);
api.use(apiRoutes);
api.get("/", () => "Server is working");

initialize()
  .then(() => {
    api.listen({
      port: config.get("server.port") as number,
      hostname: config.get("server.ip") as string,
    });
    logger.info(
      `🦊 Server is running at ${api.server?.hostname}:${process.env.PORT || 8080}`,
    );
  })
  .catch((err) => {
    logger.error("Error initializing the server");
    logger.error(err);
    if (api.server) {
      return api.stop();
    }
  });
