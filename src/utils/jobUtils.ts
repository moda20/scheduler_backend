import { t, TSchema } from "elysia";

import config from "@config/config";
import { getCacheFile, saveCacheFile } from "@repositories/cacheFiles";
import { saveNewFile } from "@repositories/outputFiles";
import logger from "@utils/loggers";
import cronParser from "cron-parser";
import { readdirSync, statSync } from "fs-extra";
import path from "path";
export const Nullable = <T extends TSchema>(T: T) => {
  // type Nullable<T> = T | null
  return t.Union([T, t.Null()]);
};

/**
 * Get the next execution time of a cron job
 * @param cronSetting
 * @returns
 */
export const getNextJobExecution = (cronSetting: string): Date | null => {
  try {
    const interval = cronParser.parse(cronSetting);
    return interval.next().toDate();
  } catch (err) {
    console.error(`Error parsing cron: ${cronSetting}`, err);
    return null;
  }
};

/**
 * Sleep for a given number of seconds
 * @param seconds
 * @returns
 */
export const sleep = (seconds = 0) => {
  return new Promise<void>((res) =>
    setTimeout(() => {
      res();
    }, 1000 * seconds),
  );
};

/**
 * Export results to a file
 * @param results a jsonifiable object
 * @param fileName
 * @param job_log_id
 * @param tags extra tags to add as a file marker
 * @param type file type, nothing more than a tag
 * @param newFile setting this to True will remove from files and database any previous exported file with the same name
 * @async
 */
export const exportResultsToFile = async ({
  results,
  fileName,
  job_log_id,
  tags,
  type = "json",
  newFile = false,
}: {
  results: any;
  fileName: string;
  job_log_id: string;
  tags?: any;
  type?: string;
  newFile?: boolean;
}) => {
  if (!config.get("files.exportOutputFiles")) {
    logger.info(`result exporting is disabled, not exporting for ${fileName}`);
    return;
  }
  const existingFile = {
    result: results,
    time: new Date().toDateString(),
  };
  const finalTags = Array.isArray(tags) ? tags.join(",") : tags?.toString();
  return saveNewFile({
    fileName: `${fileName}.json`,
    data: JSON.stringify(existingFile, null, 4),
    tags: finalTags,
    type: type,
    jobLogId: job_log_id,
    newFile: newFile,
  })
    .then((results) => {
      logger.info(`File exported successfully to ${results.filePath}\n`);
    })
    .catch((err) => {
      logger.error(`error saving exported file ${fileName}\n`);
      logger.error(err);
    });
};

/**
 * Export caches to a file, caches are a separated files from output files
 * and have a time to live number of 24h, by default
 * @param results a jsonifiable object
 * @param fileName
 * @param job_log_id
 * @param tags extra tags to add as a file marker
 * @param type file type, nothing more than a tag
 * @param ttl
 * @param newFile setting this to True will remove from files and database any previous exported file with the same name, defaults to true for caches
 * @async
 */
export const exportCacheFiles = async ({
  data,
  fileName,
  job_log_id,
  tags,
  type = "json",
  ttl = 24 * 60 * 60,
  newFile = false,
}: {
  data: any;
  fileName: string;
  job_log_id: string;
  tags?: any;
  type?: string;
  ttl?: number;
  newFile?: boolean;
}) => {
  if (!config.get("files.exportCacheFiles")) {
    logger.info(`result exporting is disabled, not exporting for ${fileName}`);
    return;
  }
  const existingFile = {
    result: data,
    time: new Date().toDateString(),
  };
  const finalTags = Array.isArray(tags) ? tags.join(",") : tags?.toString();
  return saveCacheFile({
    fileName: `${fileName}.json`,
    data: JSON.stringify(existingFile, null, 4),
    tags: finalTags,
    type: type,
    jobLogId: job_log_id,
    newFile: newFile,
    ttl,
  })
    .then((results) => {
      logger.info(`Cache file exported successfully to ${results.filePath}\n`);
    })
    .catch((err) => {
      logger.error(`error saving cache file ${fileName}\n`);
      logger.error(err);
    });
};

export const getFromCache = async (fileName: string) => {
  return getCacheFile({ filename: fileName }).then((file: any) => {
    return file?.fileData?.toString();
  });
};

/**
 * Convert a value to JSON string, takes into consideration BigInt
 * @param param  A jsonifiable object
 * @returns string
 */
export const toJSON = (param: any): any => {
  return JSON.parse(
    JSON.stringify(
      param,
      (key, value) => (typeof value === "bigint" ? value.toString() : value), // return everything else unchanged
    ),
  );
};

/**
 * Find files recursively
 * @param dir
 * @param ext
 * @param files
 * @param result
 * @param regex
 */

export const findFiles = (
  dir: string,
  ext: string[],
  regex?: RegExp,
  files?: string[],
  result?: string[],
): string[] => {
  files = files || readdirSync(dir);
  result = result || [];
  regex = regex || new RegExp(`^.*\\.(${ext?.join("|")})$`);
  for (let i = 0; i < files.length; i++) {
    const file = path.join(dir, files[i]);
    if (statSync(file).isDirectory() && !path.extname(file)) {
      try {
        result = findFiles(file, ext, regex, readdirSync(file), result);
      } catch (error) {
        continue;
      }
    } else {
      if (regex.test(file)) {
        result.push(`/${file}`);
      }
    }
  }
  return result;
};
