import { JobConsumer } from "@jobConsumer/jobConsumer";
import { getAllProxies, testProxy } from "@repositories/proxies";
import { PromisePool } from "@supercharge/promise-pool";
import { JobDTO, JobLogDTO, JobOptions } from "@typesDef/models/job";
import dayJs from "@utils/dayJs";
import defaultRedactor from "@utils/httpUtils/redactors";
import { z } from "zod";

interface proxyTestingJobParams {
  excludeDisabledProxies?: boolean;
  concurrentTestRequests?: number;
  requestTimeout?: number;
}

const proxyTestingJobParamsSchema = z.object({
  excludeDisabledProxies: z.boolean().optional(),
  concurrentTestRequests: z.number().optional(),
  requestTimeout: z.number().optional(),
});

class ProxyTestJob extends JobConsumer {
  constructor() {
    super();
  }

  async run(job: JobDTO, jobLog: JobLogDTO) {
    const parsedConfig = proxyTestingJobParamsSchema.parse(
      job.param?.config ?? {},
    );
    const config: proxyTestingJobParams = {
      excludeDisabledProxies: true,
      concurrentTestRequests: 1,
      requestTimeout: 60000,
      ...parsedConfig,
    };
    const isTestUrlValid = !!this.options?.config?.proxies?.proxyTestingUrl;
    if (!isTestUrlValid) {
      throw new Error("Proxy testing url is not configured");
    }
    this.logEvent("Getting proxies to test, will ignore disabled proxies");
    const allProxies = await getAllProxies({
      limit: 99999,
      excludeDisabled: config.excludeDisabledProxies,
    });

    this.logEvent(`Will test ${allProxies.length} proxies`);
    const { results, errors } = await PromisePool.for(allProxies)
      .withConcurrency(config.concurrentTestRequests!)
      .process(async (proxy) => {
        const proxyName = `${proxy.proxy_ip}:${proxy.proxy_port}`;
        try {
          const startTime = performance.now();
          const testResponse = await testProxy(proxy.id, {
            timeout: config.requestTimeout,
          });
          const duration = performance.now() - startTime;
          this.logEvent(
            `proxy ${proxyName} test returned with status ${testResponse.status}`,
          );
          return {
            data: testResponse.data,
            duration,
            proxyName,
          };
        } catch (err) {
          this.logEvent(
            `Error encountered when testing the proxy ${proxyName}`,
          );
          this.emitError(`proxy (${proxyName}) test failed`);
          throw {
            error: err,
            proxyName,
          };
        }
      });

    if (errors?.length) {
      this.logEvent(
        "Error when testing proxies, full error and successful tests will be exported as an output file",
      );
    }
    this.logEvent(">>>>>>>>>>>>>>>> Testing Results >>>>>>>>>>>>>>>>");
    for (const proxyTest of results) {
      this.logEvent(
        `${proxyTest.proxyName} : SUCCESS  | duration : ${proxyTest.duration}ms`,
      );
    }
    for (const error of errors) {
      this.logEvent(`${error.item.proxy_ip}:${error.item.proxy_port} : FAILED`);
    }

    await this.exportResultsToFile({
      job_log_id: jobLog.id,
      fileName: `proxy_test_results_${dayJs().format("YYYY-MM-DD-HH-mm")}`,
      newFile: true,
      results: {
        successfulTests: results,
        errors: errors,
      },
    });
    const jobFinishedMessage = `Tested ${allProxies.length} proxies, ${results.length} succeeded, ${errors.length} failed`;
    return this.complete(jobLog, jobFinishedMessage);
  }
}

export default new ProxyTestJob();
