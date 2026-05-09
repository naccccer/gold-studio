-- Add soft-archive metadata for user-facing assets and projects.
ALTER TABLE `Project`
  ADD COLUMN `resultStorageKey` VARCHAR(191) NULL,
  ADD COLUMN `archivedAt` DATETIME(3) NULL;

ALTER TABLE `ProductAsset`
  ADD COLUMN `archivedAt` DATETIME(3) NULL;

CREATE INDEX `Project_userId_archivedAt_idx` ON `Project`(`userId`, `archivedAt`);
CREATE INDEX `ProductAsset_userId_archivedAt_idx` ON `ProductAsset`(`userId`, `archivedAt`);
