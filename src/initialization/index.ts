import type { PrismaClient } from "@generated/prisma";
import { PrismaClient as BasePrismaClient } from "@generated/prisma_base";
import logger from "@utils/loggers";

import {
  createPrismaClient,
  runBaseMigrations,
  runMigrations,
} from "../../prisma";

import { start } from "./ScheduleManager";

let prisma: PrismaClient;
let basePrisma: BasePrismaClient;

export const initialize = async () => {
  [prisma, basePrisma] = await createPrismaClient();
  logger.info("Migrating the database");
  runMigrations();
  runBaseMigrations();
  const managerResults = await start();
  logger.info("Schedule manager initialized");

  return { managerResults };
};

export { basePrisma, prisma };
