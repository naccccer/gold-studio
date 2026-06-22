ALTER TABLE `BillingPackage`
  ADD COLUMN `projectLimit` INTEGER NULL,
  ADD COLUMN `freeVariantLimit` INTEGER NOT NULL DEFAULT 2;

ALTER TABLE `UserSubscription`
  DROP FOREIGN KEY `UserSubscription_packageId_fkey`;

ALTER TABLE `UserSubscription`
  MODIFY `packageId` VARCHAR(191) NULL,
  ADD COLUMN `customTitle` VARCHAR(191) NULL,
  ADD COLUMN `periodDays` INTEGER NULL,
  ADD COLUMN `projectLimit` INTEGER NULL,
  ADD COLUMN `projectsUsedThisPeriod` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `reservedProjects` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `freeVariantLimit` INTEGER NOT NULL DEFAULT 2;

UPDATE `UserSubscription` AS `subscription`
INNER JOIN `BillingPackage` AS `package`
  ON `package`.`id` = `subscription`.`packageId`
SET
  `subscription`.`periodDays` = `package`.`periodDays`,
  `subscription`.`projectLimit` = `package`.`projectLimit`,
  `subscription`.`freeVariantLimit` = `package`.`freeVariantLimit`;

ALTER TABLE `GenerationCreditReservation`
  ADD COLUMN `reservesProject` BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE `UserSubscription`
  ADD CONSTRAINT `UserSubscription_packageId_fkey`
  FOREIGN KEY (`packageId`) REFERENCES `BillingPackage`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
