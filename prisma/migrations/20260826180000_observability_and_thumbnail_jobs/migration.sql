ALTER TABLE `Project`
  ADD COLUMN `generationPrepareDurationMs` INTEGER NULL,
  ADD COLUMN `generationPersistDurationMs` INTEGER NULL;

ALTER TABLE `ProviderEvent`
  ADD COLUMN `requestId` VARCHAR(64) NULL,
  ADD COLUMN `costUnit` DECIMAL(18, 8) NULL,
  ADD COLUMN `costPaidIrt` DECIMAL(18, 2) NULL,
  ADD COLUMN `costGrantIrt` DECIMAL(18, 2) NULL,
  ADD COLUMN `costResolvedAt` DATETIME(3) NULL,
  ADD COLUMN `costLookupAttempts` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `costLookupAttemptedAt` DATETIME(3) NULL;

CREATE INDEX `ProviderEvent_requestId_idx` ON `ProviderEvent`(`requestId`);
CREATE INDEX `ProviderEvent_provider_costResolvedAt_createdAt_idx` ON `ProviderEvent`(`provider`, `costResolvedAt`, `createdAt`);

CREATE TABLE `ThumbnailJob` (
  `id` VARCHAR(191) NOT NULL,
  `storageKey` VARCHAR(512) NOT NULL,
  `status` ENUM('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'QUEUED',
  `attemptCount` INTEGER NOT NULL DEFAULT 0,
  `errorMessage` TEXT NULL,
  `availableAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `startedAt` DATETIME(3) NULL,
  `finishedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `ThumbnailJob_storageKey_key`(`storageKey`),
  INDEX `ThumbnailJob_status_availableAt_idx`(`status`, `availableAt`),
  INDEX `ThumbnailJob_finishedAt_idx`(`finishedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `WebVitalSample` (
  `id` VARCHAR(191) NOT NULL,
  `metricId` VARCHAR(128) NOT NULL,
  `name` VARCHAR(16) NOT NULL,
  `value` DOUBLE NOT NULL,
  `delta` DOUBLE NULL,
  `rating` VARCHAR(16) NOT NULL,
  `navigationType` VARCHAR(32) NULL,
  `path` VARCHAR(255) NOT NULL,
  `deviceType` VARCHAR(16) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `WebVitalSample_metricId_name_key`(`metricId`, `name`),
  INDEX `WebVitalSample_name_createdAt_idx`(`name`, `createdAt`),
  INDEX `WebVitalSample_path_createdAt_idx`(`path`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
