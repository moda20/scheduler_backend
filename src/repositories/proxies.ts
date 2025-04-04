import { prisma } from "@initialization/index";
import { newProxyConfig, proxyUpdateConfig } from "@typesDef/models/proxy";

export const getAllProxies = async ({
  limit,
  offset,
  search,
}: {
  limit?: number;
  offset?: number;
  search?: string;
}) => {
  return prisma.proxy.findMany({
    take: limit,
    skip: offset,
    where: search
      ? {
          OR: [
            { proxy_ip: { contains: search } },
            { protocol: { contains: search } },
            { username: { contains: search } },
            { password: { contains: search } },
            { description: { contains: search } },
          ],
        }
      : undefined,
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
