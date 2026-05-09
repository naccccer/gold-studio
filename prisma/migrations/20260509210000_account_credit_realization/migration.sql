ALTER TABLE `CreditEvent`
  MODIFY `source` ENUM('ADMIN', 'PACKAGE', 'SUBSCRIPTION', 'GENERATION', 'REFERRAL') NOT NULL;

ALTER TABLE `User`
  ADD COLUMN `referralCode` VARCHAR(191) NULL;

UPDATE `User`
SET `referralCode` = CONCAT('GS', UPPER(SUBSTRING(`id`, -8)))
WHERE `referralCode` IS NULL;

CREATE UNIQUE INDEX `User_referralCode_key` ON `User`(`referralCode`);

ALTER TABLE `UserSubscription`
  ADD COLUMN `purchaseRequestId` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `UserSubscription_purchaseRequestId_key` ON `UserSubscription`(`purchaseRequestId`);

CREATE TABLE `Referral` (
  `id` VARCHAR(191) NOT NULL,
  `inviterId` VARCHAR(191) NOT NULL,
  `inviteeId` VARCHAR(191) NOT NULL,
  `codeUsed` VARCHAR(191) NOT NULL,
  `rewardCredits` INTEGER NOT NULL DEFAULT 2,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `Referral_inviteeId_key`(`inviteeId`),
  INDEX `Referral_inviterId_createdAt_idx`(`inviterId`, `createdAt`),
  INDEX `Referral_codeUsed_idx`(`codeUsed`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `UserOutputSettings` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `defaultOutputPreset` VARCHAR(191) NOT NULL DEFAULT 'post',
  `preferredQuality` VARCHAR(191) NOT NULL DEFAULT '2K',
  `fileNamingMode` VARCHAR(191) NOT NULL DEFAULT 'project-date',
  `autoSaveToProjects` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `UserOutputSettings_userId_key`(`userId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SupportSettings` (
  `id` VARCHAR(191) NOT NULL DEFAULT 'default',
  `phone` VARCHAR(191) NULL,
  `whatsappUrl` VARCHAR(191) NULL,
  `telegramUrl` VARCHAR(191) NULL,
  `instructions` TEXT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `SupportSettings` (`id`, `phone`, `whatsappUrl`, `telegramUrl`, `instructions`, `isActive`, `updatedAt`)
VALUES ('default', NULL, NULL, NULL, 'برای پیگیری سریع‌تر، موضوع و شناسه پروژه را در تیکت بنویسید.', true, NOW(3))
ON DUPLICATE KEY UPDATE `id` = `id`;

CREATE TABLE `SupportTicket` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `subject` VARCHAR(191) NOT NULL,
  `status` ENUM('OPEN', 'ANSWERED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `SupportTicket_userId_createdAt_idx`(`userId`, `createdAt`),
  INDEX `SupportTicket_status_createdAt_idx`(`status`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SupportTicketMessage` (
  `id` VARCHAR(191) NOT NULL,
  `ticketId` VARCHAR(191) NOT NULL,
  `authorType` ENUM('USER', 'ADMIN') NOT NULL,
  `userId` VARCHAR(191) NULL,
  `adminId` VARCHAR(191) NULL,
  `body` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `SupportTicketMessage_ticketId_createdAt_idx`(`ticketId`, `createdAt`),
  INDEX `SupportTicketMessage_userId_idx`(`userId`),
  INDEX `SupportTicketMessage_adminId_idx`(`adminId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `FaqItem` (
  `id` VARCHAR(191) NOT NULL,
  `question` VARCHAR(191) NOT NULL,
  `answer` TEXT NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `FaqItem_isActive_sortOrder_idx`(`isActive`, `sortOrder`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `FaqItem` (`id`, `question`, `answer`, `isActive`, `sortOrder`, `createdAt`, `updatedAt`)
VALUES
  ('faq_receipt_review', 'رسید پرداخت چه زمانی بررسی می‌شود؟', 'بعد از ارسال رسید، درخواست خرید در پنل ادمین بررسی می‌شود و پس از تایید، اعتبار یا اشتراک روی حساب شما فعال می‌شود.', true, 10, NOW(3), NOW(3)),
  ('faq_credit_usage', 'اعتبار برای چه چیزی مصرف می‌شود؟', 'هر خروجی ساخته‌شده یک اعتبار مصرف می‌کند. اگر اشتراک فعال داشته باشید، ابتدا اعتبار همان اشتراک مصرف می‌شود.', true, 20, NOW(3), NOW(3)),
  ('faq_source_photos', 'چه عکسی نتیجه بهتری می‌دهد؟', 'عکس واضح، بدون برش از محصول، با نور کافی و پس‌زمینه ساده معمولاً بهترین خروجی را می‌دهد.', true, 30, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE `id` = `id`;

ALTER TABLE `CreditEvent`
  ADD COLUMN `purchaseRequestId` VARCHAR(191) NULL,
  ADD COLUMN `referralId` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `CreditEvent_purchaseRequestId_key` ON `CreditEvent`(`purchaseRequestId`);
CREATE INDEX `CreditEvent_referralId_idx` ON `CreditEvent`(`referralId`);

ALTER TABLE `UserSubscription`
  ADD CONSTRAINT `UserSubscription_purchaseRequestId_fkey` FOREIGN KEY (`purchaseRequestId`) REFERENCES `PurchaseRequest`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Referral`
  ADD CONSTRAINT `Referral_inviterId_fkey` FOREIGN KEY (`inviterId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Referral_inviteeId_fkey` FOREIGN KEY (`inviteeId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `UserOutputSettings`
  ADD CONSTRAINT `UserOutputSettings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `SupportTicket`
  ADD CONSTRAINT `SupportTicket_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `SupportTicketMessage`
  ADD CONSTRAINT `SupportTicketMessage_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `SupportTicket`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `SupportTicketMessage_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `SupportTicketMessage_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `CreditEvent`
  ADD CONSTRAINT `CreditEvent_purchaseRequestId_fkey` FOREIGN KEY (`purchaseRequestId`) REFERENCES `PurchaseRequest`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `CreditEvent_referralId_fkey` FOREIGN KEY (`referralId`) REFERENCES `Referral`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
