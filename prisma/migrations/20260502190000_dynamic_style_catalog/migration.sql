ALTER TABLE `Project`
  ADD COLUMN `styleId` VARCHAR(191) NULL;

ALTER TABLE `GenerationBatch`
  ADD COLUMN `styleId` VARCHAR(191) NULL;

UPDATE `Project` p
JOIN `CreativeStyle` s ON s.`preset` = p.`stylePreset`
SET p.`styleId` = s.`id`;

UPDATE `GenerationBatch` b
JOIN `CreativeStyle` s ON s.`preset` = b.`stylePreset`
SET b.`styleId` = s.`id`;

UPDATE `Project`
SET `styleId` = (SELECT s.`id` FROM `CreativeStyle` s ORDER BY s.`sortOrder` ASC, s.`createdAt` ASC LIMIT 1)
WHERE `styleId` IS NULL;

UPDATE `GenerationBatch`
SET `styleId` = (SELECT s.`id` FROM `CreativeStyle` s ORDER BY s.`sortOrder` ASC, s.`createdAt` ASC LIMIT 1)
WHERE `styleId` IS NULL;

ALTER TABLE `Project`
  MODIFY `styleId` VARCHAR(191) NOT NULL,
  DROP COLUMN `stylePreset`;

ALTER TABLE `GenerationBatch`
  MODIFY `styleId` VARCHAR(191) NOT NULL,
  DROP COLUMN `stylePreset`;

ALTER TABLE `CreativeStyle`
  DROP INDEX `CreativeStyle_preset_key`,
  DROP COLUMN `preset`;

CREATE INDEX `Project_styleId_idx` ON `Project`(`styleId`);
CREATE INDEX `GenerationBatch_styleId_idx` ON `GenerationBatch`(`styleId`);

ALTER TABLE `Project`
  ADD CONSTRAINT `Project_styleId_fkey` FOREIGN KEY (`styleId`) REFERENCES `CreativeStyle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `GenerationBatch`
  ADD CONSTRAINT `GenerationBatch_styleId_fkey` FOREIGN KEY (`styleId`) REFERENCES `CreativeStyle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
