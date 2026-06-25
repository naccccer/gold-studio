ALTER TABLE `HomeCarouselSlide`
  ADD COLUMN `vertical` VARCHAR(191) NOT NULL DEFAULT 'jewelry';

CREATE INDEX `HomeCarouselSlide_vertical_isActive_sortOrder_idx`
  ON `HomeCarouselSlide`(`vertical`, `isActive`, `sortOrder`);
