ALTER TABLE `Project`
  ADD COLUMN `freeVariantUsedAt` DATETIME(3) NULL,
  ADD COLUMN `freeVariantProjectId` VARCHAR(191) NULL,
  ADD COLUMN `variantParentId` VARCHAR(191) NULL;

CREATE INDEX `Project_freeVariantProjectId_idx` ON `Project`(`freeVariantProjectId`);
CREATE INDEX `Project_variantParentId_idx` ON `Project`(`variantParentId`);
