ALTER TABLE `User`
  MODIFY `role` ENUM('USER', 'ADMIN', 'SALES') NOT NULL DEFAULT 'USER';

ALTER TABLE `SalesReferralCode`
  ADD COLUMN `salesUserId` VARCHAR(191) NULL,
  ADD INDEX `SalesReferralCode_salesUserId_createdAt_idx` (`salesUserId`, `createdAt`);

ALTER TABLE `SalesReferralCode`
  ADD CONSTRAINT `SalesReferralCode_salesUserId_fkey`
  FOREIGN KEY (`salesUserId`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
