import config from "@config/config";
import { BrowserlessHttpService } from "@utils/httpRequestConfig";
const puppeteerJsonExtractionCode = (
  url: string,
  config: { timeout: number; headers?: { [key: string]: string } },
) => {
  let headers = "";
  if (config.headers) {
    headers = `
       await page.setRequestInterception(true);
       page.on('request', request => {
          if (!request.isNavigationRequest()) {
            request.continue();
            return;
          }
          const headers = request.headers();
          ${Object.keys(config.headers)
            .map((key) => {
              return `headers['${key}'] = "${config.headers![key]}";`;
            })
            .join("\n")}
          headers['accept'] = "application/json";
          headers["content-type"] = "application/json"
          request.continue({ headers });
       });
    `;
  }
  const query = ` export default async function ({ page }) { 
  ${headers}
  let pageRes = await page.goto('${url}', {timeout: ${config.timeout}});
  let headers = pageRes.headers();
  let content = await pageRes.json();
  return {data:{headers, content}, type: "application/json",}
} `;
  return query;
};

const isBrowerlessConfigured = () => {
  return !!config.get("browserless.url") && !!config.get("browserless.token");
};

const serializeUrl = (url: string, config?: { [key: string]: string }) => {
  if (config) {
    const parsedURL = new URL(url);
    parsedURL.search = new URLSearchParams(config).toString();
    return parsedURL.toString();
  } else {
    return url;
  }
};

export const get = (
  url: string,
  extraConfig?: {
    params?: { [key: string]: string };
    scrape?: boolean;
    elements?: string;
  },
) => {
  if (!isBrowerlessConfigured())
    throw new Error("Browserless is not configured");
  let finalUrl = url;
  if (extraConfig?.params) {
    const parsedURL = new URL(url);
    parsedURL.search = new URLSearchParams(extraConfig.params).toString();
    finalUrl = parsedURL.toString();
  }
  return BrowserlessHttpService.post(
    extraConfig?.scrape ? "scrape" : "content",
    {
      url: finalUrl,
      elements: extraConfig?.scrape ? extraConfig.elements : undefined,
      rejectResourceTypes: ["image"],
      rejectRequestPattern: ["/^.*\\.(css)"],
    },
  );
};

export const getJson = (
  url: string,
  extraConfig?: {
    params?: { [key: string]: string };
    scrape?: boolean;
    elements?: string;
    timeout?: number;
    headers?: { [key: string]: string };
  },
) => {
  if (!isBrowerlessConfigured())
    throw new Error("Browserless is not configured");
  return BrowserlessHttpService.post("/function", {
    code: puppeteerJsonExtractionCode(serializeUrl(url, extraConfig?.params), {
      timeout: extraConfig?.timeout ?? 360000,
      headers: extraConfig?.headers,
    }),
  });
};
