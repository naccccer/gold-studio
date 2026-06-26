ALTER TABLE `BillingPackage`
  ADD COLUMN `vertical` VARCHAR(191) NOT NULL DEFAULT 'jewelry';

ALTER TABLE `UserSubscription`
  ADD COLUMN `vertical` VARCHAR(191) NOT NULL DEFAULT 'jewelry';

ALTER TABLE `PurchaseRequest`
  ADD COLUMN `vertical` VARCHAR(191) NOT NULL DEFAULT 'jewelry';

ALTER TABLE `CreditEvent`
  ADD COLUMN `vertical` VARCHAR(191) NOT NULL DEFAULT 'jewelry';

ALTER TABLE `GenerationCreditReservation`
  ADD COLUMN `vertical` VARCHAR(191) NOT NULL DEFAULT 'jewelry',
  ADD COLUMN `customerCredits` INTEGER NOT NULL DEFAULT 1;

CREATE TABLE `UserVerticalCreditBalance` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `vertical` VARCHAR(191) NOT NULL DEFAULT 'jewelry',
  `credits` INTEGER NOT NULL DEFAULT 0,
  `reservedCredits` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `UserVerticalCreditBalance_userId_vertical_key`(`userId`, `vertical`),
  INDEX `UserVerticalCreditBalance_vertical_idx`(`vertical`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `UserVerticalCreditBalance`
  ADD CONSTRAINT `UserVerticalCreditBalance_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX `BillingPackage_vertical_type_isActive_isPublic_sortOrder_idx`
  ON `BillingPackage`(`vertical`, `type`, `isActive`, `isPublic`, `sortOrder`);

CREATE INDEX `UserSubscription_userId_vertical_status_idx`
  ON `UserSubscription`(`userId`, `vertical`, `status`);

CREATE INDEX `PurchaseRequest_userId_vertical_status_idx`
  ON `PurchaseRequest`(`userId`, `vertical`, `status`);

CREATE INDEX `CreditEvent_userId_vertical_createdAt_idx`
  ON `CreditEvent`(`userId`, `vertical`, `createdAt`);

CREATE INDEX `GenerationCreditReservation_userId_vertical_status_createdAt_idx`
  ON `GenerationCreditReservation`(`userId`, `vertical`, `status`, `createdAt`);

UPDATE `BillingPackage`
SET `vertical` = 'jewelry',
    `credits` = GREATEST(0, ROUND(`credits` / 100));

INSERT INTO `BillingPackage` (
  `id`,
  `vertical`,
  `type`,
  `title`,
  `description`,
  `priceAmount`,
  `currency`,
  `credits`,
  `projectLimit`,
  `freeVariantLimit`,
  `periodDays`,
  `colorPreset`,
  `isActive`,
  `isPublic`,
  `sortOrder`,
  `archivedAt`,
  `createdAt`,
  `updatedAt`
)
SELECT
  CONCAT(`id`, '_food'),
  'food',
  `type`,
  `title`,
  `description`,
  `priceAmount`,
  `currency`,
  `credits`,
  `projectLimit`,
  `freeVariantLimit`,
  `periodDays`,
  `colorPreset`,
  `isActive`,
  `isPublic`,
  `sortOrder` + 1000,
  `archivedAt`,
  NOW(3),
  NOW(3)
FROM `BillingPackage`
WHERE `vertical` = 'jewelry'
  AND `archivedAt` IS NULL;

UPDATE `GenerationCreditReservation` r
LEFT JOIN `Project` p ON p.`id` = r.`projectId`
LEFT JOIN `GenerationBatch` b ON b.`id` = r.`batchId`
SET r.`vertical` = COALESCE(p.`vertical`, b.`vertical`, 'jewelry'),
    r.`customerCredits` = 1;

UPDATE `CreditEvent`
SET `vertical` = 'jewelry',
    `delta` = ROUND(`delta` / 100),
    `balanceBefore` = ROUND(`balanceBefore` / 100),
    `balanceAfter` = ROUND(`balanceAfter` / 100);

UPDATE `Referral`
SET `rewardCredits` = GREATEST(0, ROUND(`rewardCredits` / 100));

UPDATE `SalesReferralCode`
SET `creditAmount` = GREATEST(0, ROUND(`creditAmount` / 100));

UPDATE `User`
SET `credits` = 0,
    `reservedCredits` = 0;
