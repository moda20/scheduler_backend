import config from "@config/config";
import { PrismaClient } from "@generated/prisma";
import { PrismaClient as BasePrismaClient } from "@generated/prisma_base";
import logger from "@utils/loggers";
import { execSync } from "child_process";

let prisma: PrismaClient;
let basePrisma: BasePrismaClient;

/**
 * Create the prisma client
 */
const createPrismaClient = () => {
  const schedulerDatasourceUrl = `mysql://${config.get("DB.username")}:${config.get("DB.password")}@${config.get("DB.host")}:${config.get("DB.port")}/${config.get("DB.schedulerDatabaseName")}`;
  prisma = new PrismaClient({
    datasourceUrl: schedulerDatasourceUrl,
  });
  const BaseDatasourceUrl = `mysql://${config.get("BASE_DB.username")}:${config.get("BASE_DB.password")}@${config.get("BASE_DB.host")}:${config.get("BASE_DB.port")}/${config.get("BASE_DB.databaseName")}`;
  basePrisma = new BasePrismaClient({
    datasourceUrl: BaseDatasourceUrl,
  });

  return Promise.all([
    prisma.$connect().then(() => {
      logger.debug("Prisma Client connected");
      return prisma;
    }),
    basePrisma.$connect().then(() => {
      logger.debug("Base Prisma Client connected");
      return basePrisma;
    }),
  ]);
};

/**
 * Run prisma migrations programmatically, requires that you have node and the prisma cli installed
 */
const runMigrations = () => {
  try {
    const dbUrl = `mysql://${config.get("DB.username")}:${config.get("DB.password")}@${config.get("DB.host")}:${config.get("DB.port")}/${config.get("DB.schedulerDatabaseName")}`;
    let statusOutput;
    try {
      statusOutput = execSync("prisma migrate status -- -y", {
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
        console.log("err", err);
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
    console.log("error", error);
    logger.error("Error applying migrations:", error);
  }
};

/**
 * Run Base prisma migrations programmatically, requires that you have node and the prisma cli installed
 */
const runBaseMigrations = () => {
  try {
    const dbUrl = `mysql://${config.get("BASE_DB.username")}:${config.get("BASE_DB.password")}@${config.get("BASE_DB.host")}:${config.get("BASE_DB.port")}/${config.get("BASE_DB.databaseName")}`;
    let statusOutput;
    try {
      statusOutput = execSync(
        "prisma migrate status --schema ./basePrisma/schema_base.prisma -- -y",
        {
          env: { ...process.env, DATABASE_URL: dbUrl },
          stdio: "pipe",
        },
      ).toString();
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
        execSync(
          "prisma migrate deploy --schema ./basePrisma/schema_base.prisma  -- -y",
          {
            env: { ...process.env, DATABASE_URL: dbUrl },
            stdio: "inherit",
          },
        )?.toString();
        logger.info("Migrations applied successfully.");
      } catch (err: any) {
        console.log("err", err);
        if (err.status === 1) {
          logger.info("migrations applied");
        } else {
          throw err;
        }
      }
    } else {
      logger.info("No pending base migrations.");
    }
  } catch (error) {
    console.log("error", error);
    logger.error("Error applying migrations:", error);
  }
};

// @ts-ignore
export { createPrismaClient, runBaseMigrations, runMigrations };
