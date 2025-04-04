import config from "@config/config";
import pino, { TransportTargetOptions } from "pino";
import type { LokiOptions } from "pino-loki";

const JobLokiTransportTemplate = {
  target: "pino-loki",
  options: <LokiOptions>{
    batching: false,
    interval: 5,

    host: config.get("grafana.lokiUrl") || "",
    basicAuth: {
      username: config.get("grafana.username") || "",
      password: config.get("grafana.password") || "",
    },
    propsToLabels: ["level"],
  },
};

const JobLogger = (id: string, name: string) => {
  const lokiTransport = Object.assign({}, JobLokiTransportTemplate);
  lokiTransport.options.labels = {
    app: "scrap_server",
    job: name,
    uniqueId: id,
  };
  const transports = <TransportTargetOptions[]>[
    config.get("grafana.lokiUrl") && lokiTransport,
    config.get("files.exportJobLogsToFiles") && {
      target: "pino-roll",
      options: {
        file: `./src/logs/jobs/job_log_${name}_${id}.log`,
        size: "7m",
        frequency: 604800000, // 7 days
        limit: {
          count: 10,
        },
      },
    },
    config.get("env") === "development" && {
      target: "pino-pretty",
      options: { destination: 1, colorize: true, ignore: "pid,hostname" },
    },
  ].filter((e) => !!e);
  return pino(
    pino.transport({
      targets: transports,
    }),
  );
};

const generalLogger = pino(
  pino.transport({
    targets: <TransportTargetOptions[]>[
      {
        target: "pino/file",
        level: "info",
        options: { destination: "./src/logs/info.log", mkdir: true },
      },
      config.get("server.logToConsole") && {
        target: "pino-pretty",
        level: "error",
        options: { destination: 1, colorize: true, ignore: "pid,hostname" },
      },
      config.get("server.logToConsole") && {
        target: "pino-pretty",
        level: "info",
        options: { destination: 1, colorize: true, ignore: "pid,hostname" },
      },
      {
        target: "pino/file",
        level: "error",
        options: { destination: "./src/logs/error.log", mkdir: true },
      },
    ].filter((e) => !!e),
    dedupe: true,
  }),
);

export default generalLogger;
export { JobLogger };
