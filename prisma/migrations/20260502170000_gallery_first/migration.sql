-- CreateEnum-backed tables for gallery-first source assets and batch generation.

ALTER TABLE `Project` ADD COLUMN `sourceAssetId` VARCHAR(191) NULL;

CREATE TABLE `AssetCollection` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AssetCollection_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ProductAsset` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `collectionId` VARCHAR(191) NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `storageKey` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `originalName` VARCHAR(191) NULL,
    `title` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `status` ENUM('READY', 'ARCHIVED') NOT NULL DEFAULT 'READY',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProductAsset_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `ProductAsset_collectionId_idx`(`collectionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `GenerationBatch` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `stylePreset` ENUM('CLEAN_WHITE', 'WARM_LUXURY', 'DRAMATIC_DARK', 'SOFT_EDITORIAL') NOT NULL,
    `outputPreset` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `GenerationBatch_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `GenerationBatchItem` (
    `id` VARCHAR(191) NOT NULL,
    `batchId` VARCHAR(191) NOT NULL,
    `assetId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `GenerationBatchItem_batchId_idx`(`batchId`),
    INDEX `GenerationBatchItem_assetId_idx`(`assetId`),
    INDEX `GenerationBatchItem_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `Project_sourceAssetId_idx` ON `Project`(`sourceAssetId`);

ALTER TABLE `Project` ADD CONSTRAINT `Project_sourceAssetId_fkey` FOREIGN KEY (`sourceAssetId`) REFERENCES `ProductAsset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `AssetCollection` ADD CONSTRAINT `AssetCollection_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ProductAsset` ADD CONSTRAINT `ProductAsset_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ProductAsset` ADD CONSTRAINT `ProductAsset_collectionId_fkey` FOREIGN KEY (`collectionId`) REFERENCES `AssetCollection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `GenerationBatch` ADD CONSTRAINT `GenerationBatch_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `GenerationBatchItem` ADD CONSTRAINT `GenerationBatchItem_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `GenerationBatch`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `GenerationBatchItem` ADD CONSTRAINT `GenerationBatchItem_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `ProductAsset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `GenerationBatchItem` ADD CONSTRAINT `GenerationBatchItem_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
