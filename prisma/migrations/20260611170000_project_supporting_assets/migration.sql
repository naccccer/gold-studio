CREATE TABLE `ProjectSupportingAsset` (
  `id` VARCHAR(191) NOT NULL,
  `projectId` VARCHAR(191) NOT NULL,
  `assetId` VARCHAR(191) NOT NULL,
  `position` INTEGER NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `ProjectSupportingAsset_projectId_assetId_key`(`projectId`, `assetId`),
  UNIQUE INDEX `ProjectSupportingAsset_projectId_position_key`(`projectId`, `position`),
  INDEX `ProjectSupportingAsset_assetId_idx`(`assetId`),
  INDEX `ProjectSupportingAsset_projectId_position_idx`(`projectId`, `position`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ProjectSupportingAsset`
  ADD CONSTRAINT `ProjectSupportingAsset_projectId_fkey`
  FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ProjectSupportingAsset`
  ADD CONSTRAINT `ProjectSupportingAsset_assetId_fkey`
  FOREIGN KEY (`assetId`) REFERENCES `ProductAsset`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
