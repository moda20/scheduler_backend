import config from "@config/config";
import { basePrisma, prisma } from "@initialization/index";
import { NewNotificationService } from "@typesDef/models/notificationService";
import logger from "@utils/loggers";

export const seedBaseDatabase = async () => {
  const inputNotifications: NewNotificationService[] = [
    {
      image: "/public/images/gotifyIcon.png",
      name: "gotify",
      description:
        "Default gotify notification service, see implementation in the code base",
      entryPoint: "src/notifications/gotify.ts",
    },
    {
      image: "/public/images/ntfy.png",
      name: "ntfy",
      description:
        "Default ntfy notification service, see implementation in the code base",
      entryPoint: "src/notifications/ntfy.ts",
    },
    {
      image: "/public/images/slack.jpg",
      name: "slack",
      description:
        "Default Slack webhook notification service, see implementation in the code base",
      entryPoint: "src/notifications/slack.ts",
    },
  ];

  return basePrisma.notificationServices
    .createMany({
      data: inputNotifications,
      skipDuplicates: true,
    })
    .then((d) => {
      logger.info("successfully seeded base database");
      return d;
    });
};

export const seedSystemJobs = async () => {
  if (config.safeGet("jobs.seedSystemJobs", null)) {
    const inputJobs = [
      {
        job_name: "ProxyTestingJob",
        job_param: "{}",
        job_cron_setting: "0 */6 * * *",
        consumer: "src/systemJobs/proxyTestingJob.ts",
        exclusive: "1",
        status: "STOPPED",
      },
    ];

    return prisma.schedule_job
      .createMany({
        data: inputJobs,
        skipDuplicates: true,
      })
      .then(async (d) => {
        logger.info("successfully seeded system jobs");
        return d;
      });
  } else {
    logger.info("System jobs db seeding is disabled");
  }
};
