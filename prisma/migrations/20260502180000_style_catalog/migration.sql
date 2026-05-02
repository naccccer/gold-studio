CREATE TABLE `StyleCategory` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `StyleCategory_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CreativeStyle` (
    `id` VARCHAR(191) NOT NULL,
    `preset` ENUM('CLEAN_WHITE', 'WARM_LUXURY', 'DRAMATIC_DARK', 'SOFT_EDITORIAL') NOT NULL,
    `categoryId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `prompt` TEXT NOT NULL,
    `previewImageUrl` VARCHAR(191) NOT NULL,
    `previewSource` VARCHAR(191) NOT NULL DEFAULT 'placeholder',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isUserVisible` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CreativeStyle_preset_key`(`preset`),
    INDEX `CreativeStyle_categoryId_idx`(`categoryId`),
    INDEX `CreativeStyle_isActive_isUserVisible_sortOrder_idx`(`isActive`, `isUserVisible`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `StyleVariant` (
    `id` VARCHAR(191) NOT NULL,
    `styleId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `prompt` TEXT NOT NULL,
    `previewImageUrl` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StyleVariant_styleId_sortOrder_idx`(`styleId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `StyleControl` (
    `id` VARCHAR(191) NOT NULL,
    `styleId` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `type` ENUM('CHOICE', 'RANGE') NOT NULL,
    `optionsJson` TEXT NULL,
    `defaultValue` VARCHAR(191) NULL,
    `minValue` INTEGER NULL,
    `maxValue` INTEGER NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `StyleControl_styleId_key_key`(`styleId`, `key`),
    INDEX `StyleControl_styleId_sortOrder_idx`(`styleId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `CreativeStyle` ADD CONSTRAINT `CreativeStyle_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `StyleCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `StyleVariant` ADD CONSTRAINT `StyleVariant_styleId_fkey` FOREIGN KEY (`styleId`) REFERENCES `CreativeStyle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `StyleControl` ADD CONSTRAINT `StyleControl_styleId_fkey` FOREIGN KEY (`styleId`) REFERENCES `CreativeStyle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO `StyleCategory` (`id`, `slug`, `name`, `sortOrder`, `createdAt`, `updatedAt`) VALUES
('style_cat_catalog', 'catalog', 'کاتالوگ', 10, NOW(3), NOW(3)),
('style_cat_luxury', 'luxury', 'لوکس', 20, NOW(3), NOW(3)),
('style_cat_model', 'model', 'با مدل', 30, NOW(3), NOW(3));

INSERT INTO `CreativeStyle` (`id`, `preset`, `categoryId`, `name`, `description`, `prompt`, `previewImageUrl`, `previewSource`, `sortOrder`, `isActive`, `isUserVisible`, `createdAt`, `updatedAt`) VALUES
('style_clean_white', 'CLEAN_WHITE', 'style_cat_catalog', 'استودیویی روشن', 'خروجی تمیز، دقیق و آماده فروش برای کاتالوگ و فروشگاه.', 'Create a clean premium e-commerce product image with pure white background, balanced soft lighting and realistic metallic detail.', '/images/placeholders/jewelry/style-minimal.webp', 'placeholder', 10, true, true, NOW(3), NOW(3)),
('style_warm_luxury', 'WARM_LUXURY', 'style_cat_luxury', 'لوکس گرم', 'نور گرم و حس ظریف لوکس برای طلا، ساعت و اکسسوری.', 'Create a premium warm-luxury studio image with golden tones, gentle shadows, elegant reflection and high-fidelity jewelry detail.', '/images/placeholders/jewelry/style-gold.webp', 'placeholder', 20, true, true, NOW(3), NOW(3)),
('style_dramatic_dark', 'DRAMATIC_DARK', 'style_cat_luxury', 'تیره دراماتیک', 'کنتراست کنترل‌شده و زمینه تیره برای تصویر تبلیغاتی.', 'Create a dramatic dark-background product shot with high contrast, controlled highlights and premium cinematic style.', '/images/placeholders/jewelry/style-dark.webp', 'placeholder', 30, true, true, NOW(3), NOW(3)),
('style_with_model', 'SOFT_EDITORIAL', 'style_cat_model', 'با مدل', 'نمای محصول روی مدل ایرانی با استایل شیک و حجاب متعادل.', 'Create a premium product-area jewelry image on an elegant adult Iranian model with moderate hijab styling. Focus on the hands, wrist, neck, ears, or partial portrait area as appropriate. Keep the jewelry or accessory as the hero, tasteful, modest, refined, and realistic.', '/images/placeholders/jewelry/style-editorial.webp', 'placeholder', 40, true, true, NOW(3), NOW(3));

INSERT INTO `StyleControl` (`id`, `styleId`, `key`, `label`, `type`, `optionsJson`, `defaultValue`, `minValue`, `maxValue`, `sortOrder`, `isActive`, `createdAt`, `updatedAt`) VALUES
('control_model_gender', 'style_with_model', 'modelGender', 'جنسیت مدل', 'CHOICE', '[{"value":"woman","label":"زن"},{"value":"man","label":"مرد"}]', 'woman', NULL, NULL, 10, true, NOW(3), NOW(3)),
('control_modesty', 'style_with_model', 'modesty', 'وقار و پوشیدگی', 'RANGE', NULL, '65', 35, 90, 20, true, NOW(3), NOW(3));
