CREATE TABLE `BillingPackage` (
  `id` VARCHAR(191) NOT NULL,
  `type` ENUM('CREDIT_PACK', 'SUBSCRIPTION') NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NOT NULL,
  `priceAmount` INTEGER NOT NULL,
  `currency` VARCHAR(191) NOT NULL DEFAULT 'IRR',
  `credits` INTEGER NOT NULL DEFAULT 0,
  `periodDays` INTEGER NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `isPublic` BOOLEAN NOT NULL DEFAULT true,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `archivedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `UserSubscription` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `packageId` VARCHAR(191) NOT NULL,
  `status` ENUM('ACTIVE', 'PAUSED', 'CANCELED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
  `currentPeriodStart` DATETIME(3) NOT NULL,
  `currentPeriodEnd` DATETIME(3) NOT NULL,
  `creditsPerPeriod` INTEGER NOT NULL,
  `creditsUsedThisPeriod` INTEGER NOT NULL DEFAULT 0,
  `assignedByAdminId` VARCHAR(191) NULL,
  `notes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PurchaseRequest` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `packageId` VARCHAR(191) NOT NULL,
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELED') NOT NULL DEFAULT 'PENDING',
  `amount` INTEGER NOT NULL,
  `currency` VARCHAR(191) NOT NULL DEFAULT 'IRR',
  `adminNote` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CreditEvent` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `actorAdminId` VARCHAR(191) NULL,
  `delta` INTEGER NOT NULL,
  `balanceBefore` INTEGER NOT NULL,
  `balanceAfter` INTEGER NOT NULL,
  `reason` TEXT NOT NULL,
  `source` ENUM('ADMIN', 'PACKAGE', 'SUBSCRIPTION', 'GENERATION') NOT NULL,
  `packageId` VARCHAR(191) NULL,
  `subscriptionId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AdminAuditEvent` (
  `id` VARCHAR(191) NOT NULL,
  `actorAdminId` VARCHAR(191) NULL,
  `action` VARCHAR(191) NOT NULL,
  `targetType` VARCHAR(191) NOT NULL,
  `targetId` VARCHAR(191) NOT NULL,
  `summary` VARCHAR(191) NOT NULL,
  `metadata` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ProviderEvent` (
  `id` VARCHAR(191) NOT NULL,
  `projectId` VARCHAR(191) NULL,
  `provider` VARCHAR(191) NOT NULL DEFAULT 'liara',
  `operation` VARCHAR(191) NOT NULL,
  `status` ENUM('SUCCESS', 'FAILED') NOT NULL,
  `model` VARCHAR(191) NULL,
  `statusDetail` TEXT NULL,
  `errorMessage` TEXT NULL,
  `retryCount` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `BillingPackage_type_isActive_isPublic_sortOrder_idx` ON `BillingPackage`(`type`, `isActive`, `isPublic`, `sortOrder`);
CREATE INDEX `BillingPackage_archivedAt_idx` ON `BillingPackage`(`archivedAt`);
CREATE INDEX `UserSubscription_userId_status_idx` ON `UserSubscription`(`userId`, `status`);
CREATE INDEX `UserSubscription_packageId_idx` ON `UserSubscription`(`packageId`);
CREATE INDEX `UserSubscription_assignedByAdminId_idx` ON `UserSubscription`(`assignedByAdminId`);
CREATE INDEX `UserSubscription_currentPeriodEnd_idx` ON `UserSubscription`(`currentPeriodEnd`);
CREATE INDEX `PurchaseRequest_userId_status_idx` ON `PurchaseRequest`(`userId`, `status`);
CREATE INDEX `PurchaseRequest_packageId_idx` ON `PurchaseRequest`(`packageId`);
CREATE INDEX `PurchaseRequest_status_createdAt_idx` ON `PurchaseRequest`(`status`, `createdAt`);
CREATE INDEX `CreditEvent_userId_createdAt_idx` ON `CreditEvent`(`userId`, `createdAt`);
CREATE INDEX `CreditEvent_actorAdminId_idx` ON `CreditEvent`(`actorAdminId`);
CREATE INDEX `CreditEvent_packageId_idx` ON `CreditEvent`(`packageId`);
CREATE INDEX `CreditEvent_subscriptionId_idx` ON `CreditEvent`(`subscriptionId`);
CREATE INDEX `CreditEvent_source_idx` ON `CreditEvent`(`source`);
CREATE INDEX `AdminAuditEvent_actorAdminId_createdAt_idx` ON `AdminAuditEvent`(`actorAdminId`, `createdAt`);
CREATE INDEX `AdminAuditEvent_targetType_targetId_idx` ON `AdminAuditEvent`(`targetType`, `targetId`);
CREATE INDEX `AdminAuditEvent_action_idx` ON `AdminAuditEvent`(`action`);
CREATE INDEX `ProviderEvent_projectId_createdAt_idx` ON `ProviderEvent`(`projectId`, `createdAt`);
CREATE INDEX `ProviderEvent_provider_status_createdAt_idx` ON `ProviderEvent`(`provider`, `status`, `createdAt`);

ALTER TABLE `UserSubscription` ADD CONSTRAINT `UserSubscription_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `UserSubscription` ADD CONSTRAINT `UserSubscription_packageId_fkey` FOREIGN KEY (`packageId`) REFERENCES `BillingPackage`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `UserSubscription` ADD CONSTRAINT `UserSubscription_assignedByAdminId_fkey` FOREIGN KEY (`assignedByAdminId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `PurchaseRequest` ADD CONSTRAINT `PurchaseRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `PurchaseRequest` ADD CONSTRAINT `PurchaseRequest_packageId_fkey` FOREIGN KEY (`packageId`) REFERENCES `BillingPackage`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CreditEvent` ADD CONSTRAINT `CreditEvent_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `CreditEvent` ADD CONSTRAINT `CreditEvent_actorAdminId_fkey` FOREIGN KEY (`actorAdminId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `CreditEvent` ADD CONSTRAINT `CreditEvent_packageId_fkey` FOREIGN KEY (`packageId`) REFERENCES `BillingPackage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `CreditEvent` ADD CONSTRAINT `CreditEvent_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `UserSubscription`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `AdminAuditEvent` ADD CONSTRAINT `AdminAuditEvent_actorAdminId_fkey` FOREIGN KEY (`actorAdminId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `ProviderEvent` ADD CONSTRAINT `ProviderEvent_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO `BillingPackage` (`id`, `type`, `title`, `description`, `priceAmount`, `credits`, `periodDays`, `isActive`, `isPublic`, `sortOrder`, `createdAt`, `updatedAt`)
VALUES
  ('pkg_starter_credits', 'CREDIT_PACK', 'بسته شروع', 'مناسب تست چند خروجی محصولی', 390000, 10, NULL, true, true, 10, NOW(3), NOW(3)),
  ('pkg_studio_monthly', 'SUBSCRIPTION', 'اشتراک استودیو', 'اعتبار ماهانه برای فروشگاه‌های فعال', 1490000, 60, 30, true, true, 20, NOW(3), NOW(3));
