ALTER TABLE `StyleReferenceAsset`
  ADD COLUMN `visionSceneDescription` TEXT NULL,
  ADD COLUMN `visionCameraAngle` VARCHAR(191) NULL,
  ADD COLUMN `visionLighting` TEXT NULL,
  ADD COLUMN `visionBackground` TEXT NULL,
  ADD COLUMN `visionSubjectDescription` TEXT NULL,
  ADD COLUMN `visionConfidence` DOUBLE NULL,
  ADD COLUMN `visionModel` VARCHAR(191) NULL,
  ADD COLUMN `visionAnalyzedAt` DATETIME(3) NULL,
  ADD COLUMN `visionError` TEXT NULL;
