-- Store short-lived SMS verification codes for signup and password reset.
CREATE TABLE `OtpChallenge` (
  `id` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(191) NOT NULL,
  `purpose` ENUM('SIGNUP', 'PASSWORD_RESET') NOT NULL,
  `codeHash` VARCHAR(191) NOT NULL,
  `attempts` INTEGER NOT NULL DEFAULT 0,
  `expiresAt` DATETIME(3) NOT NULL,
  `consumedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `OtpChallenge_phone_purpose_expiresAt_idx`(`phone`, `purpose`, `expiresAt`),
  INDEX `OtpChallenge_consumedAt_idx`(`consumedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
