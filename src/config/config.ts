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
  jobs: {
    targetFolderForJobs: {
      doc: "The target directory for jobs inside the jobs/ folder",
      format: String,
      default: "",
      env: "JOBS_SUB_DIRECTORY",
    },
    jobsFileExtensions: {
      doc: "The extension of files to be considered as jobs: only accepts .ts and .js files",
      format: String,
      default: "ts,js",
      env: "JOBS_FILES_EXTENSIONS",
      nullable: false,
    },
  },
  exportOutputFiles: {
    doc: "Whether to export output files.",
    format: Boolean,
    default: false,
    env: "EXPORT_OUTPUT_FILE",
  },
  files: {
    exportOutputFiles: {
      doc: "Whether to export output files.",
      format: Boolean,
      default: false,
      env: "EXPORT_OUTPUT_FILE",
    },
    exportCacheFiles: {
      doc: "Whether to export cache files.",
      format: Boolean,
      default: false,
      env: "EXPORT_CACHE_FILE",
    },
    exportJobLogsToFiles: {
      doc: "Whether to export job logs to files.",
      format: Boolean,
      default: false,
      env: "EXPORT_JOB_LOGS_TO_FILES",
    },
    cacheFilesRootPath: {
      doc: "The root path for cache files.",
      format: String,
      default: "caches",
      env: "CACHE_FILES_ROOT_PATH",
    },
    outputFilesRootPath: {
      doc: "The root path for output files.",
      format: String,
      default: "exported",
      env: "OUTPUT_FILES_ROOT_PATH",
    },
    databaseBackupRootPath: {
      doc: "The root path for database backup files.",
      format: String,
      default: "db",
      env: "DB_BACKUP_FILES_ROOT_PATH",
    },
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
      default: null,
      env: "GOTIFY_URL",
      nullable: true,
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
      default: null,
      env: "GOTIFY_APP_TOKEN",
      nullable: true,
    },
    appErrorChannelToken: {
      doc: "The gotify app error channel token.",
      format: String,
      default: null,
      env: "GOTIFY_ERROR_APP_TOKEN",
      nullable: true,
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

export default config;
