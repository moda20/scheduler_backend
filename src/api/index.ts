import { outputFilesController } from "@api/files/outputFiles.controller";
import { JobsController } from "@api/jobs/jobs.controller";
import { proxiesController } from "@api/proxies/proxies.controller";
import { systemController } from "@api/system/system.controller";
import { createElysia } from "@utils/createElysia";
import logger from "@utils/loggers";

import { PokemonController } from "./pokemon/pokemon.controller";

export const apiRoutes = createElysia().onError(({ code, error, path }) => {
  logger.error(
    `error when calling ${path} with code ${code} and error ${error}`,
  );
  logger.error(error.cause);
  return new Response(error.toString(), {
    status: getErrorCode({ code, error }),
  });
});

const getErrorCode = ({ code, error }: { code: string; error: any }) => {
  if (code === "NOT_FOUND") {
    return 404;
  }
  if (code === "BAD_REQUEST") {
    return 400;
  }
  if (!isNaN(Number(error.cause))) {
    return Number(error.cause);
  }
  return 500;
};

apiRoutes.use(PokemonController);
apiRoutes.use(JobsController);
apiRoutes.use(systemController);
apiRoutes.use(outputFilesController);
apiRoutes.use(proxiesController);
