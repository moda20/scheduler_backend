import config from "@config/config";
import { proxy_status } from "@generated/prisma";
import { prisma } from "@initialization/index";
import { LogEventNames } from "@typesDef/api/jobs";
import { newProxyConfig, proxyUpdateConfig } from "@typesDef/models/proxy";
import { APIError } from "@utils/ErrorHandler";
import { ProxyTestingHttpService } from "@utils/httpRequestConfig";
import defaultRedactor from "@utils/httpUtils/redactors";
import { eventLog } from "@utils/loggers";
import logger from "@utils/loggers";
import { injectProxyIntoInstance } from "@utils/proxyUtils";
import { CreateAxiosDefaults } from "axios";

const REPO_NAME = "Proxy repository";
export const getAllProxies = async ({
  limit,
  offset,
  search,
  excludeDisabled,
}: {
  limit?: number;
  offset?: number;
  search?: string;
  excludeDisabled?: boolean;
}) => {
  const whereCondition = {
    ...(search
      ? {
          OR: [
            { proxy_ip: { contains: search } },
            { protocol: { contains: search } },
            { username: { contains: search } },
            { password: { contains: search } },
            { description: { contains: search } },
          ],
        }
      : {}),
    ...(excludeDisabled ? { status: proxy_status.active } : {}),
  };
  return prisma.proxy.findMany({
    take: limit,
    skip: offset,
    where: whereCondition,
    omit: {
      password: true,
    },
    orderBy: {
      created_at: "desc",
    },
    include: {
      jobs: {
        include: {
          schedule_job: true,
        },
      },
    },
  });
};

export const getJobProxies = (
  jobId: number,
  limit?: number,
  offset?: number,
) => {
  return prisma.schedule_job.findFirst({
    where: {
      job_id: jobId,
    },
    take: limit,
    skip: offset,
    orderBy: {
      created_at: "desc",
    },
    include: {
      proxies: {
        include: {
          proxy: true,
        },
      },
    },
  });
};

export const getProxy = async (id: number) => {
  return prisma.proxy.findUnique({
    where: {
      id,
    },
  });
};

export const addProxy = async ({
  proxy_ip,
  proxy_port,
  protocol,
  username,
  password,
  description,
  status,
}: newProxyConfig) => {
  return prisma.proxy.create({
    data: {
      proxy_ip,
      proxy_port,
      protocol,
      username,
      password,
      description,
      status,
    },
  });
};

export const updateProxy = async ({
  id,
  proxy_ip,
  proxy_port,
  protocol,
  username,
  password,
  description,
  status,
}: proxyUpdateConfig) => {
  return prisma.proxy.update({
    where: {
      id,
    },
    data: {
      proxy_ip,
      proxy_port,
      protocol,
      username,
      password,
      description,
      status,
    },
    omit: {
      password: true,
    },
  });
};

export const deleteProxy = async (id: number) => {
  return prisma.proxy.delete({
    where: {
      id,
    },
  });
};

export const removeProxyFromJob = async (id: number, job_id: number) => {
  return prisma.proxy_job.deleteMany({
    where: {
      proxy_id: id,
      job_id,
    },
  });
};

export const addProxyToJob = async (id: number, job_ids: number[]) => {
  const existingJobIdLinks = await prisma.proxy_job.findMany({
    where: {
      proxy_id: id,
    },
  });

  const linksToDelete = existingJobIdLinks.filter(
    (e) => !job_ids.includes(e.job_id),
  );
  const linksToCreate = job_ids.filter(
    (e) => !existingJobIdLinks.map((e) => e.job_id).includes(e),
  );

  return prisma.$transaction(async (tx) => {
    await tx.proxy_job.createMany({
      data: linksToCreate.map((job_id) => ({
        proxy_id: id,
        job_id,
      })),
    });

    await tx.proxy_job.deleteMany({
      where: {
        proxy_id: id,
        job_id: {
          in: linksToDelete.map((e) => e.job_id),
        },
      },
    });
  });
};

export const incrementProxyInjection = (proxyJobId: number) => {
  return prisma.proxy_job.update({
    where: {
      id: proxyJobId,
    },
    data: {
      injection_count: {
        increment: 1,
      },
    },
  });
};

export const incrementProxyUsage = (proxyJobId: number) => {
  return prisma.proxy_job.update({
    where: {
      id: proxyJobId,
    },
    data: {
      use_count: {
        increment: 1,
      },
    },
  });
};

export const testProxy = async (
  proxyId: number,
  axiosConfig?: CreateAxiosDefaults,
) => {
  const proxy = await prisma.proxy.findUnique({
    where: {
      id: proxyId,
    },
  });
  if (!proxy) {
    throw new APIError("Proxy not found", REPO_NAME);
  }

  const targetUrl = config.safeGet("proxies.proxyTestingUrl", null);
  if (!targetUrl) {
    throw new APIError(
      "Proxy testing url not set, check configuration",
      REPO_NAME,
    );
  }
  const syslog = eventLog(LogEventNames.SysLogEvent);

  const axiosInstance = ProxyTestingHttpService.create({
    baseURL: targetUrl,
    ...axiosConfig,
  });

  injectProxyIntoInstance(proxy, axiosInstance, syslog.debug);

  return axiosInstance.get(targetUrl).catch((err) => {
    syslog.error(
      `Proxy ${proxy.proxy_ip}:${proxy.proxy_port} test failed: ${err.message}`,
      {
        eventName: "PROXY_TEST_ERROR",
      },
    );
    throw defaultRedactor.redactError(err);
  });
};

export const testProxyViaTheAPI = async (proxyId: number) => {
  try {
    return await testProxy(proxyId);
  } catch (err: any) {
    logger.error(err);
    throw new APIError(err.message ?? err?.toString(), REPO_NAME);
  }
};
