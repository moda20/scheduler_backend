import { t } from "elysia";

import config from "@config/config";
import {
  getAllJobs,
  getAvailableConsumers,
  getJobMetrics,
  getJobStats,
  getLokiLogs,
  getRunningJobs,
  isJobRunning,
  jobActionExecution,
} from "@repositories/jobs";
import { createElysia } from "@utils/createElysia";
import currentRunsManager from "@utils/CurrentRunsManager";
import { Nullable, toJSON } from "@utils/jobUtils";
import qs from "qs";

export const JobsController = createElysia({ prefix: "/jobs" })
  .onBeforeHandle(({ set }) => {
    set.headers["content-type"] = "application/json; charset=utf-8";
  })
  .onTransform((ctx) => {
    // @ts-ignore
    ctx.query = qs.parse(new URL(ctx.request.url).search.slice(1));
  })
  .get(
    "/allJobs",
    ({ query }) => {
      return getAllJobs({
        limit: Number(query.limit ?? 10),
        offset: Number(query.offset ?? 0),
        name: query.name ?? "",
        status: query.status ?? ["STARTED", "STOPPED"],
        sort: query.sorting ?? [],
      });
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
        name: t.Optional(t.String()),

        status: t.Optional(t.Array(t.String())),
        sorting: t.Optional(
          t.Array(t.Object({ id: t.String(), desc: t.String() })),
        ),
      }),
    },
  )
  .post(
    "/executeAction",
    ({ body }) => {
      const { jobId, action, config } = body;
      return jobActionExecution(action, Number(jobId ?? ""), { config });
    },
    {
      body: t.Object({
        jobId: t.Optional(t.Union([t.String(), t.Number()])),
        action: t.String(),
        config: t.Optional(
          t.Object({
            name: t.String(),
            param: t.Optional(Nullable(t.String())),
            consumer: t.String(),
            cronSetting: t.String(),
          }),
        ),
      }),
    },
  )
  .get("/getAvailableConsumers", () => getAvailableConsumers())
  .get("/isJobRunning", ({ query }) => {
    return query.jobId ? isJobRunning(Number(query.jobId)) : false;
  })
  .get("/getJobStats", ({ query }) => {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;
    return getJobStats(startDate, endDate);
  })
  .get(
    "/jobMetrics",
    async ({ query }) => {
      const { jobIds } = query;
      return {
        ...(await getJobMetrics(jobIds).then((data) => toJSON(data[0]))),
        runningJobsCount: currentRunsManager.getRunningJobCount(),
      };
    },
    {
      query: t.Object({
        jobIds: t.Optional(t.Array(t.Number())),
      }),
    },
  )
  .get(
    "/jobLogs/loki",
    async ({ query }) => {
      const { start, end, query: queryString } = query;
      if (!config.get("grafana.lokiUrl")) {
        throw new Error("Loki connection is not configured", {
          cause: 400,
        });
      }
      const { data } = await getLokiLogs(
        queryString,
        Number(start),
        Number(end),
      );
      return data;
    },
    {
      query: t.Object({
        start: t.Optional(t.Union([t.Number(), t.String()])),
        end: t.Optional(t.Union([t.Number(), t.String()])),
        query: t.String(),
      }),
    },
  )
  .get("/getRunningJobs", () => {
    return getRunningJobs();
  });
