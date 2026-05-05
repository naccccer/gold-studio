-- Allow password-based signup/login with either email or phone.
ALTER TABLE `User` MODIFY `email` VARCHAR(191) NULL;

ALTER TABLE `User` ADD COLUMN `phone` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `User_phone_key` ON `User`(`phone`);
