import { Elysia, HTTPMethod } from "elysia";
import { helmet } from "elysia-helmet";
import cookie from "@elysiajs/cookie";
import { cors } from "@elysiajs/cors";

import { apiRoutes } from "@api/index";
import { auth } from "@auth/auth.controller";
import { jwtAccessSetup, jwtRefreshSetup } from "@auth/guards/setup.jwt";
import config from "@config/config";

import { start } from "./initialization";

import "@config/database/mongodb.config";

const api = new Elysia();

// Setup

api.use(jwtAccessSetup).use(jwtRefreshSetup).use(cookie());

//Security;
api.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
    exposedHeaders: process.env.CORS_EXPOSED_HEADERS || "*",
    allowedHeaders: process.env.CORS_ALLOWED_HEADER || "*",
    // @ts-ignore
    methods: (process.env.CORS_ALLOWED_METHODS! as HTTPMethod) || "*",
  }),
);
api.use(helmet());

// Routes
api.use(auth);
api.use(apiRoutes);
api.get("/", () => "Server is working");

start().then(() => {
  api.listen({
    port: config.get("server.port") as number,
    hostname: config.get("server.ip") as string,
  });
});

console.log(
  `🦊 Server is running at ${api.server?.hostname}:${process.env.PORT || 8080}`,
);
