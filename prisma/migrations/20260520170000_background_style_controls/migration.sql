UPDATE `StyleCategory`
SET
  `name` = 'پس‌زمینه',
  `updatedAt` = NOW(3)
WHERE `id` = 'style_cat_catalog';

UPDATE `CreativeStyle`
SET
  `name` = 'پس‌زمینه',
  `description` = 'خروجی تمیز و محصول‌محور با انتخاب نوع و رنگ پس‌زمینه برای فروشگاه، کاتالوگ و شبکه اجتماعی.',
  `prompt` = 'Act as a senior jewelry catalog photographer. Create a clean premium product photograph on a smooth, flat, seamless studio background selected by the user. The background must stay simple, even, and product-only: no visible folds, waves, draped fabric, cushions, props, decorative set design, steps, slabs, hard horizon lines, busy textures, or lifestyle styling. Use only subtle natural contact shadows under the product. Default to a simple soft white background when no background controls are provided. The input product is the absolute reference: preserve the exact shape, proportions, metal color, stone count and placement, chain or clasp design, engravings, texture, and visible imperfections. Use softbox studio lighting, realistic metal reflections, crisp but not over-sharpened detail, and true-to-life color. No CGI, no artificial sparkle, no plastic finish, no extra stones, no redesign, no AI-glossy look.',
  `updatedAt` = NOW(3)
WHERE `id` = 'style_clean_white';

DELETE FROM `StyleControl`
WHERE `styleId` = 'style_clean_white'
  AND `key` IN ('softShadow', 'surfaceReflection');

INSERT INTO `StyleControl` (`id`, `styleId`, `key`, `label`, `type`, `optionsJson`, `defaultValue`, `minValue`, `maxValue`, `sortOrder`, `isActive`, `createdAt`, `updatedAt`) VALUES
('control_background_type', 'style_clean_white', 'backgroundType', 'نوع پس‌زمینه', 'CHOICE', '[{"value":"simple","label":"ساده"},{"value":"fabric","label":"پارچه"},{"value":"leather","label":"چرم"},{"value":"stone","label":"سنگ"},{"value":"paper","label":"کاغذ استودیویی"}]', 'simple', NULL, NULL, 10, true, NOW(3), NOW(3)),
('control_background_color', 'style_clean_white', 'backgroundColor', 'رنگ پس‌زمینه', 'CHOICE', '[{"value":"white","label":"سفید نرم"},{"value":"cream","label":"کرم شامپاینی"},{"value":"lightGray","label":"طوسی روشن"},{"value":"blush","label":"رز خیلی ملایم"},{"value":"navy","label":"سرمه‌ای"},{"value":"charcoal","label":"ذغالی"},{"value":"softBlack","label":"مشکی نرم"},{"value":"forest","label":"سبز تیره"},{"value":"burgundy","label":"زرشکی تیره"},{"value":"espresso","label":"قهوه‌ای اسپرسو"}]', 'white', NULL, NULL, 20, true, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `label` = VALUES(`label`),
  `type` = VALUES(`type`),
  `optionsJson` = VALUES(`optionsJson`),
  `defaultValue` = VALUES(`defaultValue`),
  `minValue` = VALUES(`minValue`),
  `maxValue` = VALUES(`maxValue`),
  `sortOrder` = VALUES(`sortOrder`),
  `isActive` = true,
  `updatedAt` = NOW(3);
