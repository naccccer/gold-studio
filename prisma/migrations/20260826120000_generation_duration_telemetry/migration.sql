ALTER TABLE `Project`
  ADD COLUMN `generationQueuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN `generationStartedAt` DATETIME(3) NULL,
  ADD COLUMN `generationFinishedAt` DATETIME(3) NULL;

ALTER TABLE `ProviderEvent`
  ADD COLUMN `durationMs` INTEGER NULL;

UPDATE `Project`
SET `generationQueuedAt` = `createdAt`;

UPDATE `Project` p
LEFT JOIN (
  SELECT `projectId`, MAX(`createdAt`) AS `finishedAt`
  FROM `ProviderEvent`
  WHERE `projectId` IS NOT NULL AND `status` = 'SUCCESS'
  GROUP BY `projectId`
) provider_success ON provider_success.`projectId` = p.`id`
SET p.`generationFinishedAt` = COALESCE(provider_success.`finishedAt`, p.`updatedAt`)
WHERE p.`status` = 'COMPLETED';
