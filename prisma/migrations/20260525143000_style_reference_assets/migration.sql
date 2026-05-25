-- Add user-scoped sample/reference assets and connect them to single and batch generation.

CREATE TABLE `StyleReferenceAsset` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `storageKey` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `originalName` VARCHAR(191) NULL,
    `title` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `status` ENUM('READY', 'ARCHIVED') NOT NULL DEFAULT 'READY',
    `archivedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StyleReferenceAsset_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `StyleReferenceAsset_userId_archivedAt_idx`(`userId`, `archivedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Project`
  ADD COLUMN `referenceAssetId` VARCHAR(191) NULL;

ALTER TABLE `GenerationBatch`
  ADD COLUMN `referenceAssetId` VARCHAR(191) NULL;

CREATE INDEX `Project_referenceAssetId_idx` ON `Project`(`referenceAssetId`);
CREATE INDEX `GenerationBatch_referenceAssetId_idx` ON `GenerationBatch`(`referenceAssetId`);

ALTER TABLE `StyleReferenceAsset`
  ADD CONSTRAINT `StyleReferenceAsset_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Project`
  ADD CONSTRAINT `Project_referenceAssetId_fkey` FOREIGN KEY (`referenceAssetId`) REFERENCES `StyleReferenceAsset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `GenerationBatch`
  ADD CONSTRAINT `GenerationBatch_referenceAssetId_fkey` FOREIGN KEY (`referenceAssetId`) REFERENCES `StyleReferenceAsset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE `CreativeStyle`
SET `isUserVisible` = false
WHERE `id` = 'style_warm_luxury';

UPDATE `StyleControl`
SET
  `optionsJson` = '[{"value":"calm","label":"آرام"},{"value":"luxury","label":"لوکس"},{"value":"bold","label":"جسور"},{"value":"abstractDecor","label":"دکور انتزاعی"}]',
  `updatedAt` = NOW(3)
WHERE `styleId` = 'style_soft_editorial'
  AND `key` = 'editorialMood';

INSERT INTO `CreativeStyle`
  (`id`, `name`, `description`, `prompt`, `previewImageUrl`, `previewSource`, `sortOrder`, `isActive`, `isUserVisible`, `categoryId`, `createdAt`, `updatedAt`)
VALUES
  (
    'style_sample_reference',
    'عکس نمونه',
    'جایگذاری محصول داخل چیدمان، نور و حال‌وهوای یک نمونه انتخاب‌شده.',
    'Create a premium product image by using the user product photo as the strict product identity and the selected sample/reference image only as the source for arrangement, lighting, color mood, camera angle, surface styling, and background. Replace the subject/product in the sample with the user product. Preserve the user product form, metal, stones, engravings, details, proportions, silhouette, material finish, and identity exactly. Do not copy or retain the sample product identity. Keep the final image product-first, realistic, editorial, premium, and not a plain white catalog cutout unless the sample clearly requires that mood.',
    '/images/placeholders/jewelry/style-natural.webp',
    'placeholder',
    45,
    true,
    true,
    'style_cat_editorial',
    NOW(3),
    NOW(3)
  )
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `description` = VALUES(`description`),
  `prompt` = VALUES(`prompt`),
  `previewImageUrl` = VALUES(`previewImageUrl`),
  `previewSource` = VALUES(`previewSource`),
  `sortOrder` = VALUES(`sortOrder`),
  `isActive` = VALUES(`isActive`),
  `isUserVisible` = VALUES(`isUserVisible`),
  `categoryId` = VALUES(`categoryId`),
  `updatedAt` = NOW(3);
