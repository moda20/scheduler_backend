import config from "@config/config";
import { prisma } from "@initialization/index";
import logger from "@utils/loggers";
import bun from "bun";
import mysqldump from "mysqldump";
import { mkdir } from "node:fs/promises";
import { join, parse } from "path";

export const getSchedulerDatabaseSize = async (): Promise<
  [{ size_mb: number }]
> => {
  const query = `SELECT table_schema AS database_name, 
           ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
    FROM information_schema.tables
    WHERE table_schema = '${config.get("DB.schedulerDatabaseName")}'
    GROUP BY table_schema;`;

  return prisma.$queryRawUnsafe(query);
};

export const getSchedulerDatabaseInfo = async () => {
  const dbSize: [{ size_mb: number }] = await getSchedulerDatabaseSize();
  return {
    host: `${config.get("DB.host")}:${config.get("DB.port")}`,
    databaseName: config.get("DB.schedulerDatabaseName"),
    dbSize: dbSize[0]?.size_mb,
  };
};

export const backupSchedulerDB = async () => {
  const pathToFile = join(
    parse(bun.main).dir,
    "outputs",
    "files",
    config.get("files.databaseBackupRootPath"),
  );
  const fileName = `${config.get("DB.schedulerDatabaseName")}_backup_${new Date().toISOString()}.sql`;
  await mkdir(pathToFile, {
    recursive: true,
  }).catch((err) => {
    logger.error(`couldn't create directory for backup : ${err}`);
  });
  const fullPath = join(pathToFile, fileName);
  const result = await mysqldump({
    connection: {
      host: config.get("DB.host"),
      user: config.get("DB.username"),
      password: config.get("DB.password"),
      database: config.get("DB.schedulerDatabaseName"),
    },
    dumpToFile: fullPath,
  });
  return {
    result,
    pathToFile: fullPath,
  };
};
