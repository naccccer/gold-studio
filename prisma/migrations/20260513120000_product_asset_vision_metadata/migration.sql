ALTER TABLE `ProductAsset`
  ADD COLUMN `productType` VARCHAR(191) NULL,
  ADD COLUMN `visionShortTitle` VARCHAR(191) NULL,
  ADD COLUMN `visionDescription` TEXT NULL,
  ADD COLUMN `visionAngle` VARCHAR(191) NULL,
  ADD COLUMN `visionQualityIssues` TEXT NULL,
  ADD COLUMN `visionConfidence` DOUBLE NULL,
  ADD COLUMN `visionModel` VARCHAR(191) NULL,
  ADD COLUMN `visionAnalyzedAt` DATETIME(3) NULL,
  ADD COLUMN `visionError` TEXT NULL;
