ALTER TABLE `User` ADD COLUMN `startGuideSeenAt` DATETIME(3) NULL;

UPDATE `User` SET `startGuideSeenAt` = NOW(3) WHERE `startGuideSeenAt` IS NULL;
