import { getJobProxies } from "@repositories/proxies";
import type { AxiosInstance } from "axios";

export const injectProxy = async ({
  jobId,
  axiosInstance,
  logger,
}: {
  jobId: number;
  axiosInstance: AxiosInstance;
  logger?: any;
}) => {
  const targetJob = await getJobProxies(Number(jobId));
  if (targetJob?.proxies?.length) {
    const proxy = targetJob.proxies.pop()?.proxy;
    if (proxy) {
      logger && logger(`proxy ${proxy.proxy_ip}:${proxy.proxy_port} injected`);
      axiosInstance.defaults.proxy = {
        host: proxy.proxy_ip,
        port: proxy.proxy_port,
        protocol: proxy.protocol,
        auth: {
          username: proxy.username ?? "",
          password: proxy.password ?? "",
        },
      };
      return {
        ...proxy,
        password: "***",
      };
    }
  }
};
