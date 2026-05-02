ALTER TABLE `Project`
    MODIFY `stylePreset` ENUM('CLEAN_WHITE', 'WARM_LUXURY', 'DRAMATIC_DARK', 'SOFT_EDITORIAL', 'WITH_MODEL', 'SOCIAL_MEDIA') NOT NULL;

ALTER TABLE `GenerationBatch`
    MODIFY `stylePreset` ENUM('CLEAN_WHITE', 'WARM_LUXURY', 'DRAMATIC_DARK', 'SOFT_EDITORIAL', 'WITH_MODEL', 'SOCIAL_MEDIA') NOT NULL;

ALTER TABLE `CreativeStyle`
    MODIFY `preset` ENUM('CLEAN_WHITE', 'WARM_LUXURY', 'DRAMATIC_DARK', 'SOFT_EDITORIAL', 'WITH_MODEL', 'SOCIAL_MEDIA') NOT NULL;

INSERT INTO `StyleCategory` (`id`, `slug`, `name`, `sortOrder`, `createdAt`, `updatedAt`) VALUES
('style_cat_editorial', 'editorial', 'ادیتوریال', 25, NOW(3), NOW(3)),
('style_cat_social', 'social', 'شبکه اجتماعی', 40, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
`name` = VALUES(`name`),
`sortOrder` = VALUES(`sortOrder`),
`updatedAt` = NOW(3);

UPDATE `StyleCategory`
SET `name` = 'کاتالوگ', `updatedAt` = NOW(3)
WHERE `id` = 'style_cat_catalog';

UPDATE `StyleCategory`
SET `name` = 'لوکس', `updatedAt` = NOW(3)
WHERE `id` = 'style_cat_luxury';

UPDATE `StyleCategory`
SET `name` = 'با مدل', `updatedAt` = NOW(3)
WHERE `id` = 'style_cat_model';

UPDATE `CreativeStyle`
SET
  `name` = 'استودیویی روشن',
  `description` = 'خروجی تمیز، دقیق و آماده فروش برای کاتالوگ و فروشگاه.',
  `prompt` = 'Create a clean premium e-commerce product image with pure white background, balanced soft lighting and realistic metallic detail.',
  `previewImageUrl` = '/images/placeholders/jewelry/style-minimal.webp',
  `sortOrder` = 10,
  `isActive` = true,
  `isUserVisible` = true,
  `updatedAt` = NOW(3)
WHERE `preset` = 'CLEAN_WHITE';

UPDATE `CreativeStyle`
SET
  `name` = 'لوکس گرم',
  `description` = 'نور گرم و حس ظریف لوکس برای طلا، ساعت و اکسسوری.',
  `prompt` = 'Create a premium warm-luxury studio image with golden tones, gentle shadows, elegant reflection and high-fidelity jewelry detail.',
  `previewImageUrl` = '/images/placeholders/jewelry/style-gold.webp',
  `sortOrder` = 20,
  `isActive` = true,
  `isUserVisible` = true,
  `updatedAt` = NOW(3)
WHERE `preset` = 'WARM_LUXURY';

UPDATE `CreativeStyle`
SET
  `name` = 'تیره دراماتیک',
  `description` = 'کنتراست کنترل‌شده و زمینه تیره برای تصویر تبلیغاتی.',
  `prompt` = 'Create a dramatic dark-background product shot with high contrast, controlled highlights and premium cinematic style.',
  `previewImageUrl` = '/images/placeholders/jewelry/style-dark.webp',
  `sortOrder` = 30,
  `isActive` = true,
  `isUserVisible` = true,
  `updatedAt` = NOW(3)
WHERE `preset` = 'DRAMATIC_DARK';

UPDATE `CreativeStyle`
SET
  `preset` = 'WITH_MODEL',
  `categoryId` = 'style_cat_model',
  `name` = 'با مدل',
  `description` = 'نمای محصول روی مدل ایرانی با استایل شیک و حجاب متعادل.',
  `prompt` = 'Create a premium product-area jewelry image on an elegant adult Iranian model with moderate hijab styling. Focus on the hands, wrist, neck, ears, or partial portrait area as appropriate. Keep the jewelry or accessory as the hero, tasteful, modest, refined, and realistic.',
  `previewImageUrl` = '/images/placeholders/jewelry/style-editorial.webp',
  `sortOrder` = 50,
  `isActive` = true,
  `isUserVisible` = true,
  `updatedAt` = NOW(3)
WHERE `id` = 'style_with_model';

INSERT INTO `CreativeStyle` (`id`, `preset`, `categoryId`, `name`, `description`, `prompt`, `previewImageUrl`, `previewSource`, `sortOrder`, `isActive`, `isUserVisible`, `createdAt`, `updatedAt`) VALUES
('style_soft_editorial', 'SOFT_EDITORIAL', 'style_cat_editorial', 'ادیتوریال نرم', 'فضای مجله‌ای آرام و ظریف برای نمایش احساسی‌تر محصول.', 'Create a soft editorial jewelry product image with refined composition, gentle shadows, creamy neutral surfaces, and product-first luxury styling.', '/images/placeholders/jewelry/style-natural.webp', 'placeholder', 40, true, true, NOW(3), NOW(3)),
('style_social_media', 'SOCIAL_MEDIA', 'style_cat_social', 'شبکه اجتماعی', 'خروجی چشم‌گیر و تمیز برای پست‌های فروش و معرفی محصول.', 'Create a polished social-media-ready jewelry product image with strong visual clarity, refined negative space, premium lighting, and a clean commercial composition.', '/images/placeholders/jewelry/style-gold.webp', 'placeholder', 60, true, true, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
`categoryId` = VALUES(`categoryId`),
`name` = VALUES(`name`),
`description` = VALUES(`description`),
`prompt` = VALUES(`prompt`),
`previewImageUrl` = VALUES(`previewImageUrl`),
`sortOrder` = VALUES(`sortOrder`),
`isActive` = VALUES(`isActive`),
`isUserVisible` = VALUES(`isUserVisible`),
`updatedAt` = NOW(3);

UPDATE `StyleControl`
SET `label` = 'جنسیت مدل', `updatedAt` = NOW(3)
WHERE `id` = 'control_model_gender';

UPDATE `StyleControl`
SET `optionsJson` = '[{"value":"woman","label":"زن"},{"value":"man","label":"مرد"}]', `updatedAt` = NOW(3)
WHERE `id` = 'control_model_gender';

UPDATE `StyleControl`
SET `label` = 'وقار و پوشیدگی', `updatedAt` = NOW(3)
WHERE `id` = 'control_modesty';
