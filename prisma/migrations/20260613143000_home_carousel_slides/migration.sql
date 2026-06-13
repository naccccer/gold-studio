CREATE TABLE `HomeCarouselSlide` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NULL,
  `beforeImageUrl` VARCHAR(191) NOT NULL,
  `beforeStorageKey` VARCHAR(191) NULL,
  `afterImageUrl` VARCHAR(191) NOT NULL,
  `afterStorageKey` VARCHAR(191) NULL,
  `beforeAlt` VARCHAR(191) NULL,
  `afterAlt` VARCHAR(191) NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `HomeCarouselSlide_isActive_sortOrder_idx` ON `HomeCarouselSlide`(`isActive`, `sortOrder`);
CREATE INDEX `HomeCarouselSlide_sortOrder_createdAt_idx` ON `HomeCarouselSlide`(`sortOrder`, `createdAt`);
