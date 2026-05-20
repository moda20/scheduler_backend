import { proxy_job } from "@generated/prisma";
import {
  getJobProxies,
  incrementProxyInjection,
  incrementProxyUsage,
} from "@repositories/proxies";
import { proxyPickingStrategy } from "@typesDef/proxies";
import type { AxiosInstance } from "axios";
import { SocksProxyAgent } from "socks-proxy-agent";

export const getProxyConfigWithStrategy = (
  proxies: proxy_job[],
  strategy?: proxyPickingStrategy,
  targetId?: number,
) => {
  if (!strategy) return proxies[0];
  switch (strategy) {
    case proxyPickingStrategy.RANDOM:
      return proxies[Math.floor(Math.random() * proxies.length)];
    case proxyPickingStrategy.ROUND_ROBIN:
      return proxies.sort((a, b) =>
        a.injection_count < b.injection_count ? 1 : -1,
      )[0];
    case proxyPickingStrategy.LEAST_USED:
      return proxies.sort((a, b) => (a.use_count < b.use_count ? 1 : -1))[0];
    case proxyPickingStrategy.SPECIFIC:
      return proxies.find((p) => p.proxy_id === targetId);
    default:
      throw new Error("Invalid proxy picking strategy");
  }
};

export const injectProxy = async ({
  jobId,
  axiosInstance,
  logger,
  proxyStrategy,
  targetProxyId,
}: {
  jobId: number;
  axiosInstance: AxiosInstance;
  logger?: any;
  proxyStrategy?: proxyPickingStrategy;
  targetProxyId?: number;
}) => {
  const targetJob = await getJobProxies(Number(jobId));
  if (targetJob?.proxies?.length) {
    type extPRoxyJob = (typeof targetJob.proxies)[0];
    const proxyJob = getProxyConfigWithStrategy(
      targetJob.proxies,
      proxyStrategy,
      targetProxyId,
    ) as extPRoxyJob;
    const proxy = proxyJob?.proxy;

    logger &&
      logger(
        `Using ${proxyStrategy} strategy to pick from ${targetJob.proxies?.length} proxies`,
      );

    if (proxy) {
      logger && logger(`proxy ${proxy.proxy_ip}:${proxy.proxy_port} injected`);
      const isSocksProxy = proxy.protocol?.includes("socks");
      if (isSocksProxy) {
        logger(
          "!!WARNING!! Using socks proxy will replace your default https and https agent",
        );
        const proxyAgent = new SocksProxyAgent(
          `${proxy.protocol}://${proxy.proxy_ip}:${proxy.proxy_port}`,
        );
        axiosInstance.defaults.httpAgent = proxyAgent;
        axiosInstance.defaults.httpsAgent = proxyAgent;
      } else {
        axiosInstance.defaults.proxy = {
          host: proxy.proxy_ip,
          port: proxy.proxy_port,
          protocol: proxy.protocol,
          auth: proxy.username
            ? {
                username: proxy.username,
                password: proxy.password,
              }
            : undefined,
        };
      }

      const proxyUsageInterceptor = axiosInstance.interceptors.request.use(
        (config) => {
          incrementProxyUsage(proxyJob.id).then();
          return config;
        },
      );

      incrementProxyInjection(proxyJob.id).then();
      return {
        ...proxy,
        password: "***",
        proxyUsageInterceptor,
      };
    }
  }
};
