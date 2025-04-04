import type { PrismaClient } from "@generated/prisma";

import { createPrismaClient } from "../../prisma";

import { start } from "./ScheduleManager";

let prisma: PrismaClient;

export const initialize = async () => {
  prisma = await createPrismaClient();
  const managerResults = await start();

  return { managerResults };
};

export { prisma };
