-- CreateTable
CREATE TABLE IF NOT EXISTS `SequelizeMeta` (
    `name` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `name`(`name`),
    PRIMARY KEY (`name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `cache_files` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `job_log_id` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `file_name` VARCHAR(255) NOT NULL,
    `file_tags` VARCHAR(255) NULL,
    `file_path` VARCHAR(255) NOT NULL,
    `file_size` BIGINT NOT NULL,
    `time_to_live` BIGINT NOT NULL,
    `file_type` VARCHAR(255) NOT NULL,
    `last_downloaded` DATETIME(0) NULL,

    UNIQUE INDEX `id`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `output_files` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `job_log_id` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `file_name` VARCHAR(255) NOT NULL,
    `file_tags` VARCHAR(255) NULL,
    `file_path` VARCHAR(255) NOT NULL,
    `file_size` BIGINT NOT NULL,
    `file_type` VARCHAR(255) NOT NULL,
    `last_downloaded` DATETIME(0) NULL,

    UNIQUE INDEX `id`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `proxy` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `proxy_ip` VARCHAR(255) NOT NULL,
    `proxy_port` INTEGER NOT NULL,
    `protocol` VARCHAR(255) NOT NULL,
    `username` VARCHAR(255) NULL,
    `password` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` DATETIME(0) NOT NULL,
    `updated_at` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `proxy_job` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `job_id` INTEGER NOT NULL,
    `proxy_id` INTEGER NOT NULL,
    `created_at` DATETIME(0) NOT NULL,
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `job_id`(`job_id`),
    INDEX `proxy_id`(`proxy_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `schedule_job` (
    `job_id` INTEGER NOT NULL AUTO_INCREMENT,
    `job_name` VARCHAR(200) NOT NULL DEFAULT '',
    `job_param` LONGTEXT NULL,
    `job_cron_setting` VARCHAR(100) NOT NULL DEFAULT '',
    `consumer` VARCHAR(1000) NOT NULL DEFAULT '',
    `exclusive` VARCHAR(5) NOT NULL DEFAULT '',
    `status` VARCHAR(10) NOT NULL DEFAULT '',
    `average_time` FLOAT NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `job_name`(`job_name`),
    PRIMARY KEY (`job_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `schedule_job_log` (
    `job_log_id` VARCHAR(100) NOT NULL,
    `job_id` INTEGER NOT NULL,
    `machine` VARCHAR(100) NULL,
    `start_time` DATETIME(0) NOT NULL,
    `end_time` DATETIME(0) NULL,
    `result` LONGTEXT NULL,
    `error` LONGTEXT NULL,

    INDEX `job_id`(`job_id`),
    PRIMARY KEY (`job_log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `proxy_job` ADD CONSTRAINT `proxy_job_ibfk_1` FOREIGN KEY (`job_id`) REFERENCES `schedule_job`(`job_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `proxy_job` ADD CONSTRAINT `proxy_job_ibfk_2` FOREIGN KEY (`proxy_id`) REFERENCES `proxy`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

