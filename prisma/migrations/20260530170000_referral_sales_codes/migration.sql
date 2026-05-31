ALTER TABLE `User` ALTER COLUMN `credits` SET DEFAULT 1;

ALTER TABLE `CreditEvent`
  MODIFY `source` ENUM('SIGNUP', 'ADMIN', 'PACKAGE', 'SUBSCRIPTION', 'GENERATION', 'REFERRAL', 'SALES_CODE') NOT NULL;

ALTER TABLE `Referral`
  MODIFY `rewardCredits` INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN `rewardGrantedAt` DATETIME(3) NULL,
  ADD COLUMN `rewardPurchaseRequestId` VARCHAR(191) NULL;

UPDATE `Referral` r
SET `rewardGrantedAt` = (
  SELECT MIN(ce.`createdAt`)
  FROM `CreditEvent` ce
  WHERE ce.`referralId` = r.`id`
    AND ce.`source` = 'REFERRAL'
)
WHERE EXISTS (
  SELECT 1
  FROM `CreditEvent` ce
  WHERE ce.`referralId` = r.`id`
    AND ce.`source` = 'REFERRAL'
);

UPDATE `Referral`
SET `rewardCredits` = 5
WHERE `rewardGrantedAt` IS NULL;

CREATE UNIQUE INDEX `Referral_rewardPurchaseRequestId_key` ON `Referral`(`rewardPurchaseRequestId`);
CREATE INDEX `Referral_rewardGrantedAt_idx` ON `Referral`(`rewardGrantedAt`);

CREATE TABLE `SalesReferralCode` (
  `id` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `creditAmount` INTEGER NOT NULL DEFAULT 5,
  `batchKey` VARCHAR(191) NOT NULL,
  `salespersonName` VARCHAR(191) NULL,
  `note` TEXT NULL,
  `createdByAdminId` VARCHAR(191) NOT NULL,
  `redeemedByUserId` VARCHAR(191) NULL,
  `redeemedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `SalesReferralCode_code_key`(`code`),
  INDEX `SalesReferralCode_batchKey_createdAt_idx`(`batchKey`, `createdAt`),
  INDEX `SalesReferralCode_redeemedAt_createdAt_idx`(`redeemedAt`, `createdAt`),
  INDEX `SalesReferralCode_createdByAdminId_createdAt_idx`(`createdByAdminId`, `createdAt`),
  INDEX `SalesReferralCode_redeemedByUserId_idx`(`redeemedByUserId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Referral`
  ADD CONSTRAINT `Referral_rewardPurchaseRequestId_fkey` FOREIGN KEY (`rewardPurchaseRequestId`) REFERENCES `PurchaseRequest`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `SalesReferralCode`
  ADD CONSTRAINT `SalesReferralCode_createdByAdminId_fkey` FOREIGN KEY (`createdByAdminId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `SalesReferralCode_redeemedByUserId_fkey` FOREIGN KEY (`redeemedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
