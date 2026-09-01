CREATE TABLE `DiscountCode` (
  `id` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `type` ENUM('PERCENTAGE', 'FIXED_AMOUNT') NOT NULL,
  `value` INTEGER NOT NULL,
  `scope` ENUM('ALL_PACKAGES', 'VERTICAL', 'PACKAGES') NOT NULL DEFAULT 'ALL_PACKAGES',
  `vertical` VARCHAR(191) NULL,
  `startsAt` DATETIME(3) NULL,
  `expiresAt` DATETIME(3) NULL,
  `maxRedemptions` INTEGER NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `note` TEXT NULL,
  `archivedAt` DATETIME(3) NULL,
  `createdByAdminId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `DiscountCode_code_key`(`code`),
  INDEX `DiscountCode_isActive_archivedAt_startsAt_expiresAt_idx`(`isActive`, `archivedAt`, `startsAt`, `expiresAt`),
  INDEX `DiscountCode_createdByAdminId_createdAt_idx`(`createdByAdminId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `DiscountCodePackage` (
  `discountCodeId` VARCHAR(191) NOT NULL,
  `packageId` VARCHAR(191) NOT NULL,
  INDEX `DiscountCodePackage_packageId_idx`(`packageId`),
  PRIMARY KEY (`discountCodeId`, `packageId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `PurchaseRequest`
  ADD COLUMN `originalAmount` INTEGER NULL,
  ADD COLUMN `discountCodeId` VARCHAR(191) NULL,
  ADD COLUMN `discountCodeSnapshot` VARCHAR(191) NULL,
  ADD COLUMN `discountTypeSnapshot` ENUM('PERCENTAGE', 'FIXED_AMOUNT') NULL,
  ADD COLUMN `discountValueSnapshot` INTEGER NULL,
  ADD COLUMN `discountAmount` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `discountAppliedAt` DATETIME(3) NULL,
  ADD COLUMN `discountReservedUntil` DATETIME(3) NULL;

UPDATE `PurchaseRequest` SET `originalAmount` = `amount` WHERE `originalAmount` IS NULL;

ALTER TABLE `PurchaseRequest`
  MODIFY `originalAmount` INTEGER NOT NULL,
  ADD INDEX `PurchaseRequest_discountCodeId_status_idx`(`discountCodeId`, `status`),
  ADD CONSTRAINT `PurchaseRequest_discountCodeId_fkey` FOREIGN KEY (`discountCodeId`) REFERENCES `DiscountCode`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `DiscountCode`
  ADD CONSTRAINT `DiscountCode_createdByAdminId_fkey` FOREIGN KEY (`createdByAdminId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `DiscountCodePackage`
  ADD CONSTRAINT `DiscountCodePackage_discountCodeId_fkey` FOREIGN KEY (`discountCodeId`) REFERENCES `DiscountCode`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `DiscountCodePackage_packageId_fkey` FOREIGN KEY (`packageId`) REFERENCES `BillingPackage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
