CREATE TABLE `ProviderSettings` (
  `id` VARCHAR(191) NOT NULL,
  `activeModel` VARCHAR(191) NOT NULL,
  `fallbackModels` TEXT NOT NULL,
  `autoFallback` BOOLEAN NOT NULL DEFAULT true,
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `ProviderSettings` (`id`, `activeModel`, `fallbackModels`, `autoFallback`, `updatedAt`)
VALUES (
  'default',
  'google/gemini-3-pro-image-preview',
  '["openai/gpt-image-2","google/gemini-2.5-flash-image"]',
  true,
  NOW(3)
);
