import config from "@config/config";
// @ts-ignore
import { ScheduleJobManager } from "schedule-manager";
import { startAllJobs } from "./jobsManager";

export async function start() {
  const initResult = await ScheduleJobManager.initWithMySQLConfig({
    host: config.get("DB.host") as string,
    port: config.get("DB.port") as number,
    user: config.get("DB.username") as string,
    password: config.get("DB.password") as string,
    database: config.get("DB.schedulerDatabaseName") as string,
    waitForConnections: true,
    connectionLimit: 5,
  });

  if (initResult.success) {
    const jobsStartResults = await startAllJobs();
    return { initResult, jobsStartResults };
  } else {
    console.log(initResult);
    throw "Error when initializing scheduler";
  }
}
