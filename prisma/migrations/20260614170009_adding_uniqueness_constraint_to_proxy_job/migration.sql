/*
  Warnings:

  - A unique constraint covering the columns `[job_id,proxy_id]` on the table `proxy_job` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `proxy_job_job_id_proxy_id_key` ON `proxy_job`(`job_id`, `proxy_id`);
