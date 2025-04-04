import config from "@config/config";
import { PrismaClient } from "@generated/prisma";
import logger from "@utils/loggers";
import { execSync } from "child_process";

let prisma: PrismaClient;

/**
 * Create the prisma client
 */
const createPrismaClient = () => {
  prisma = new PrismaClient({
    datasourceUrl: `mysql://${config.get("DB.username")}:${config.get("DB.password")}@${config.get("DB.host")}:${config.get("DB.port")}/${config.get("DB.schedulerDatabaseName")}`,
  });
  return prisma.$connect().then(() => prisma);
};

/**
 * Run prisma migrations programmatically, reuires that you have node and the prisma cli installed
 */
const runMigrations = () => {
  try {
    const dbUrl = `mysql://${config.get("DB.username")}:${config.get("DB.password")}@${config.get("DB.host")}:${config.get("DB.port")}/${config.get("DB.schedulerDatabaseName")}`;
    let statusOutput;
    try {
      statusOutput = execSync("npx prisma migrate status -- -y", {
        env: { ...process.env, DATABASE_URL: dbUrl },
        stdio: "pipe",
      }).toString();
    } catch (err: any) {
      statusOutput = err.stdout?.toString?.();
      if (err.status === 1) {
        logger.info("found migrations to apply");
      } else {
        throw err;
      }
    }
    if (
      statusOutput
        .toString()
        .includes("Following migration have not yet been applied")
    ) {
      try {
        execSync("prisma migrate deploy  -- -y", {
          env: { ...process.env, DATABASE_URL: dbUrl },
          stdio: "inherit",
        })?.toString();
        logger.info("Migrations applied successfully.");
      } catch (err: any) {
        if (err.status === 1) {
          logger.info("migrations applied");
        } else {
          throw err;
        }
      }
    } else {
      logger.info("No pending migrations.");
    }
  } catch (error) {
    logger.error("Error applying migrations:", error);
  }
};

// @ts-ignore
export { createPrismaClient, runMigrations };
