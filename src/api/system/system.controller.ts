import {
  backupBaseDB,
  backupSchedulerDB,
  getBaseDatabaseInfo,
  getSchedulerDatabaseInfo,
} from "@repositories/systemRepository";
import { createElysia } from "@utils/createElysia";
import { file } from "bun";
import qs from "qs";

export const systemController = createElysia({ prefix: "/system" })
  .onTransform((ctx) => {
    // @ts-ignore
    ctx.query = qs.parse(new URL(ctx.request.url).search.slice(1));
  })
  .get("/getDbConnection", () => {
    return getSchedulerDatabaseInfo();
  })
  .get("/backupAndDownloadSchedulerDB", async () => {
    const { pathToFile } = await backupSchedulerDB();
    return file(pathToFile);
  })
  .get("/getBaseDbConnection", () => {
    return getBaseDatabaseInfo();
  })
  .get("/backupAndDownloadBaseDB", async () => {
    const { pathToFile } = await backupBaseDB();
    return file(pathToFile);
  });
