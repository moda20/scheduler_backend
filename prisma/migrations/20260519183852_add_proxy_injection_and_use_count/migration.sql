-- AlterTable
ALTER TABLE `proxy_job` ADD COLUMN `injection_count` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `use_count` INTEGER NOT NULL DEFAULT 0;
