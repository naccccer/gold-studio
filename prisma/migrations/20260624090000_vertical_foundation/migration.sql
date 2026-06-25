ALTER TABLE `Project`
  ADD COLUMN `vertical` VARCHAR(191) NOT NULL DEFAULT 'jewelry';

ALTER TABLE `ProductAsset`
  ADD COLUMN `vertical` VARCHAR(191) NOT NULL DEFAULT 'jewelry';

ALTER TABLE `GenerationBatch`
  ADD COLUMN `vertical` VARCHAR(191) NOT NULL DEFAULT 'jewelry';

ALTER TABLE `CreativeStyle`
  ADD COLUMN `vertical` VARCHAR(191) NOT NULL DEFAULT 'jewelry';

ALTER TABLE `StyleCategory`
  ADD COLUMN `vertical` VARCHAR(191) NOT NULL DEFAULT 'jewelry';

ALTER TABLE `StyleReferenceAsset`
  ADD COLUMN `vertical` VARCHAR(191) NOT NULL DEFAULT 'jewelry';

UPDATE `Project` SET `vertical` = 'jewelry' WHERE `vertical` IS NULL OR `vertical` = '';
UPDATE `ProductAsset` SET `vertical` = 'jewelry' WHERE `vertical` IS NULL OR `vertical` = '';
UPDATE `GenerationBatch` SET `vertical` = 'jewelry' WHERE `vertical` IS NULL OR `vertical` = '';
UPDATE `CreativeStyle` SET `vertical` = 'jewelry' WHERE `vertical` IS NULL OR `vertical` = '';
UPDATE `StyleCategory` SET `vertical` = 'jewelry' WHERE `vertical` IS NULL OR `vertical` = '';
UPDATE `StyleReferenceAsset` SET `vertical` = 'jewelry' WHERE `vertical` IS NULL OR `vertical` = '';

CREATE INDEX `Project_userId_vertical_createdAt_idx` ON `Project`(`userId`, `vertical`, `createdAt`);
CREATE INDEX `Project_userId_vertical_archivedAt_idx` ON `Project`(`userId`, `vertical`, `archivedAt`);
CREATE INDEX `ProductAsset_userId_vertical_createdAt_idx` ON `ProductAsset`(`userId`, `vertical`, `createdAt`);
CREATE INDEX `ProductAsset_userId_vertical_archivedAt_idx` ON `ProductAsset`(`userId`, `vertical`, `archivedAt`);
CREATE INDEX `GenerationBatch_userId_vertical_createdAt_idx` ON `GenerationBatch`(`userId`, `vertical`, `createdAt`);
CREATE INDEX `CreativeStyle_vertical_isActive_isUserVisible_sortOrder_idx` ON `CreativeStyle`(`vertical`, `isActive`, `isUserVisible`, `sortOrder`);
CREATE INDEX `StyleReferenceAsset_userId_vertical_createdAt_idx` ON `StyleReferenceAsset`(`userId`, `vertical`, `createdAt`);
CREATE INDEX `StyleReferenceAsset_userId_vertical_archivedAt_idx` ON `StyleReferenceAsset`(`userId`, `vertical`, `archivedAt`);
