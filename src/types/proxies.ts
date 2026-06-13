import type { AxiosInstance } from "axios";

export enum proxyPickingStrategy {
  RANDOM = "RANDOM",
  ROUND_ROBIN = "ROUND_ROBIN",
  SPECIFIC = "SPECIFIC",
  LEAST_USED = "LEAST_USED",
}

export interface jobProxyConfig {
  proxyStrategy?: proxyPickingStrategy;
  targetProxyId?: number;
}

export interface ProxyManagerConstructorInterface {
  jobId: number;
  defaultAxiosInstance: AxiosInstance;
  proxyStrategy?: proxyPickingStrategy;
  targetProxyId?: number;
  logger: (data: any) => void;
}
