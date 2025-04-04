import type { PrismaClient } from "@generated/prisma";
import logger from "@utils/loggers";

import { createPrismaClient, runMigrations } from "../../prisma";

import { start } from "./ScheduleManager";

let prisma: PrismaClient;

export const initialize = async () => {
  prisma = await createPrismaClient();
  logger.info("Migrating the database");
  runMigrations();
  const managerResults = await start();
  logger.info("Schedule manager initialized");

  return { managerResults };
};

export { prisma };
