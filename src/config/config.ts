import convict from "convict";
import { ipaddress } from "convict-format-with-validator";

convict.addFormat(ipaddress);

const config = convict({
  env: {
    doc: "The application environment.",
    format: ["production", "development", "test"],
    default: "development",
    env: "NODE_ENV",
  },
  server: {
    ip: {
      doc: "The server ip.",
      format: "ipaddress",
      default: "0.0.0.0",
      env: "IP",
    },
    port: {
      doc: "The server port.",
      format: "port",
      default: 8080,
      env: "PORT",
    },
    logToConsole: {
      doc: "Whether to log to console.",
      format: Boolean,
      default: true,
      env: "LOG_TO_CONSOLE",
    },
  },
  exportOutputFiles: {
    doc: "Whether to export output files.",
    format: Boolean,
    default: false,
    env: "EXPORT_OUTPUT_FILE",
  },
  DB: {
    host: {
      doc: "The database host.",
      format: "ipaddress",
      default: "127.0.0.1",
      env: "DB_HOST",
    },
    port: {
      doc: "The database port.",
      format: "port",
      default: 3306,
      env: "DB_PORT",
    },
    username: {
      doc: "The database username.",
      format: String,
      default: "root",
      env: "DB_USERNAME",
    },
    password: {
      doc: "The database password.",
      format: String,
      default: "root",
      env: "DB_PASSWORD",
    },
    schedulerDatabaseName: {
      doc: "The database name for the scheduler.",
      format: String,
      default: "scheduler",
      env: "SCHEDULER_DB_NAME",
    },
  },
  gotify: {
    url: {
      doc: "The gotify url.",
      format: String,
      default: "https://gotify.example.com",
      env: "GOTIFY_URL",
    },
    token: {
      doc: "The gotify token.",
      format: String,
      default: "token",
      env: "GOTIFY_TOKEN",
    },
    appToken: {
      doc: "The gotify app token.",
      format: String,
      default: "appToken",
      env: "GOTIFY_APP_TOKEN",
    },
    appErrorChannelToken: {
      doc: "The gotify app error channel token.",
      format: String,
      default: "appErrorChannelToken",
      env: "GOTIFY_ERROR_APP_TOKEN",
    },
  },
  grafana: {
    lokiUrl: {
      doc: "The grafana loki url.",
      format: String,
      default: null,
      env: "GRAFANA_LOKI_URL",
      nullable: true,
    },
    username: {
      doc: "The grafana loki username.",
      format: String,
      default: null,
      env: "GRAFANA_LOKI_USERNAME",
      nullable: true,
    },
    password: {
      doc: "The grafana loki password.",
      format: String,
      default: null,
      env: "GRAFANA_LOKI_PASSWORD",
      nullable: true,
    },
  },
  browserless: {
    url: {
      doc: "The browserless url.",
      format: String,
      default: null,
      env: "BROWSERLESS_URL",
      nullable: true,
    },
    token: {
      doc: "The browserless token.",
      format: String,
      default: "token",
      env: "BROWSERLESS_TOKEN",
      nullable: true,
    },
    timeout: {
      doc: "The browserless Timeout",
      format: Number,
      default: 360000,
      env: "BROWSERLESS_TIMEOUT",
      nullable: false,
    },
  },
});

config.loadFile("./config.json");

export default config;
