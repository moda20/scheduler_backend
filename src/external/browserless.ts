import config from "@config/config";
import { BrowserlessHttpService } from "@utils/httpRequestConfig";
const puppeteerJsonExtractionCode = (
  url: string,
  config: { timeout: number },
) => ` export default async function ({ page }) { 
  let pageRes = await page.goto('${url}', {timeout: ${config.timeout}});
  let headers = pageRes.headers();
  let content = await pageRes.json();
  return {data:{headers, content}, type: "application/json",}
} `;

const isBrowerlessConfigured = () => {
  return !!config.get("browserless.url") && !!config.get("browserless.token");
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
  },
) => {
  if (!isBrowerlessConfigured())
    throw new Error("Browserless is not configured");
  return BrowserlessHttpService.post("/function", {
    code: puppeteerJsonExtractionCode(url, {
      timeout: extraConfig?.timeout ?? 360000,
    }),
  });
};
