-- Add reserved-credit accounting so generation credit is captured only after a successful output.

ALTER TABLE `User`
  ADD COLUMN `reservedCredits` INTEGER NOT NULL DEFAULT 0;

ALTER TABLE `UserSubscription`
  ADD COLUMN `reservedCredits` INTEGER NOT NULL DEFAULT 0;

CREATE TABLE `GenerationCreditReservation` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `projectId` VARCHAR(191) NULL,
  `batchId` VARCHAR(191) NULL,
  `subscriptionId` VARCHAR(191) NULL,
  `source` ENUM('CREDIT_BALANCE', 'SUBSCRIPTION') NOT NULL,
  `status` ENUM('RESERVED', 'CAPTURED', 'RELEASED') NOT NULL DEFAULT 'RESERVED',
  `capturedAt` DATETIME(3) NULL,
  `releasedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  INDEX `GenerationCreditReservation_userId_status_createdAt_idx`(`userId`, `status`, `createdAt`),
  INDEX `GenerationCreditReservation_projectId_status_idx`(`projectId`, `status`),
  INDEX `GenerationCreditReservation_batchId_status_idx`(`batchId`, `status`),
  INDEX `GenerationCreditReservation_subscriptionId_status_idx`(`subscriptionId`, `status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `GenerationCreditReservation`
  ADD CONSTRAINT `GenerationCreditReservation_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `GenerationCreditReservation`
  ADD CONSTRAINT `GenerationCreditReservation_projectId_fkey`
  FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `GenerationCreditReservation`
  ADD CONSTRAINT `GenerationCreditReservation_batchId_fkey`
  FOREIGN KEY (`batchId`) REFERENCES `GenerationBatch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `GenerationCreditReservation`
  ADD CONSTRAINT `GenerationCreditReservation_subscriptionId_fkey`
  FOREIGN KEY (`subscriptionId`) REFERENCES `UserSubscription`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
