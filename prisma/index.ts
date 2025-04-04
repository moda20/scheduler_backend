import config from "@config/config";
import { PrismaClient } from "@generated/prisma";

let prisma: PrismaClient;

const createPrismaClient = () => {
  prisma = new PrismaClient({
    datasourceUrl: `mysql://${config.get("DB.username")}:${config.get("DB.password")}@${config.get("DB.host")}:${config.get("DB.port")}/${config.get("DB.schedulerDatabaseName")}`,
  });
  return prisma.$connect().then(() => prisma);
};

// @ts-ignore
export { createPrismaClient };
