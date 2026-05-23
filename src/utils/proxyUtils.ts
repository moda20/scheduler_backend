import { proxy, proxy_job } from "@generated/prisma";
import {
  getJobProxies,
  incrementProxyInjection,
  incrementProxyUsage,
} from "@repositories/proxies";
import { proxyPickingStrategy } from "@typesDef/proxies";
import type { AxiosInstance } from "axios";
import { fetch as bunFetch } from "netbun";

export const injectProxyIntoInstance = (
  proxy: proxy,
  axiosInstance: AxiosInstance,
  logger?: (x: any) => void,
) => {
  const isSocksProxy = proxy.protocol?.includes("socks");
  if (isSocksProxy) {
    logger &&
      logger(
        "!!WARNING!! Using socks proxy will use a custom fetch function. Check here : https://github.com/oven-sh/bun/issues/16812",
      );
    const proxyUrl = `${proxy.protocol}://${proxy.username ? proxy.username + ":" + proxy.password + "@" : ""}${proxy.proxy_ip}:${proxy.proxy_port}`;
    // TODO as of this addition, bun doesn't fully oir partially support socks5 proxies,
    // so we are going to use a custom fetch function to handle the socks for now.
    // socks proxy is inadvised for now, as this might expose more problems in the future
    axiosInstance.defaults.adapter = "fetch";

    axiosInstance.defaults.env = {
      fetch: (req, init) => {
        return bunFetch(req, {
          ...init,
          proxy: proxyUrl,
        });
      },
    };
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

  return axiosInstance;
};

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

      injectProxyIntoInstance(proxy, axiosInstance, logger);

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
