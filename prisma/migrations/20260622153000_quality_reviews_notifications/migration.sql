ALTER TABLE `CreditEvent`
  MODIFY `source` ENUM('SIGNUP', 'ADMIN', 'PACKAGE', 'SUBSCRIPTION', 'GENERATION', 'QUALITY_REFUND', 'REFERRAL', 'SALES_CODE') NOT NULL;

CREATE TABLE `UserNotification` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `body` TEXT NOT NULL,
  `type` ENUM('SYSTEM', 'ADMIN', 'QUALITY_REVIEW', 'BILLING', 'SUPPORT') NOT NULL DEFAULT 'SYSTEM',
  `source` ENUM('SYSTEM', 'ADMIN', 'QUALITY_REVIEW', 'BILLING', 'SUPPORT') NOT NULL DEFAULT 'SYSTEM',
  `href` VARCHAR(191) NULL,
  `readAt` DATETIME(3) NULL,
  `createdByAdminId` VARCHAR(191) NULL,
  `metadata` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `QualityReview` (
  `id` VARCHAR(191) NOT NULL,
  `projectId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `reason` ENUM('PRODUCT_CHANGED', 'DETAILS_MISSING', 'COLOR_OR_STONES_WRONG', 'OTHER') NOT NULL,
  `userNote` TEXT NULL,
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `aiScore` DOUBLE NULL,
  `aiRecommendation` VARCHAR(191) NULL,
  `aiSummary` TEXT NULL,
  `aiRaw` JSON NULL,
  `aiModel` VARCHAR(191) NULL,
  `aiAnalyzedAt` DATETIME(3) NULL,
  `aiError` TEXT NULL,
  `reviewedByAdminId` VARCHAR(191) NULL,
  `adminNote` TEXT NULL,
  `refundCreditEventId` VARCHAR(191) NULL,
  `creditRefundedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `QualityReview_projectId_key` ON `QualityReview`(`projectId`);
CREATE UNIQUE INDEX `QualityReview_refundCreditEventId_key` ON `QualityReview`(`refundCreditEventId`);
CREATE INDEX `UserNotification_userId_readAt_createdAt_idx` ON `UserNotification`(`userId`, `readAt`, `createdAt`);
CREATE INDEX `UserNotification_createdByAdminId_createdAt_idx` ON `UserNotification`(`createdByAdminId`, `createdAt`);
CREATE INDEX `UserNotification_source_createdAt_idx` ON `UserNotification`(`source`, `createdAt`);
CREATE INDEX `QualityReview_userId_status_createdAt_idx` ON `QualityReview`(`userId`, `status`, `createdAt`);
CREATE INDEX `QualityReview_status_createdAt_idx` ON `QualityReview`(`status`, `createdAt`);
CREATE INDEX `QualityReview_reviewedByAdminId_updatedAt_idx` ON `QualityReview`(`reviewedByAdminId`, `updatedAt`);

ALTER TABLE `UserNotification`
  ADD CONSTRAINT `UserNotification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `UserNotification`
  ADD CONSTRAINT `UserNotification_createdByAdminId_fkey` FOREIGN KEY (`createdByAdminId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `QualityReview`
  ADD CONSTRAINT `QualityReview_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `QualityReview`
  ADD CONSTRAINT `QualityReview_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `QualityReview`
  ADD CONSTRAINT `QualityReview_reviewedByAdminId_fkey` FOREIGN KEY (`reviewedByAdminId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `QualityReview`
  ADD CONSTRAINT `QualityReview_refundCreditEventId_fkey` FOREIGN KEY (`refundCreditEventId`) REFERENCES `CreditEvent`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
