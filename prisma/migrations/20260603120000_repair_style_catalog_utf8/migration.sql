ALTER TABLE `StyleControl` MODIFY `type` ENUM('CHOICE', 'RANGE', 'BOOLEAN') NOT NULL;

INSERT INTO `StyleCategory` (`id`, `slug`, `name`, `sortOrder`, `createdAt`, `updatedAt`) VALUES
('style_cat_model', 'model', 'با مدل', 10, NOW(3), NOW(3)),
('style_cat_catalog', 'catalog', 'پس زمینه', 20, NOW(3), NOW(3)),
('style_cat_social', 'social', 'شبکه اجتماعی', 30, NOW(3), NOW(3)),
('style_cat_editorial', 'editorial', 'ادیتوریال', 40, NOW(3), NOW(3)),
('style_cat_cinematic', 'cinematic', 'سینماتیک', 50, NOW(3), NOW(3)),
('style_cat_luxury', 'luxury', 'آرشیو', 90, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `slug` = VALUES(`slug`),
  `name` = VALUES(`name`),
  `sortOrder` = VALUES(`sortOrder`),
  `updatedAt` = NOW(3);

INSERT INTO `CreativeStyle`
  (`id`, `categoryId`, `name`, `description`, `prompt`, `previewImageUrl`, `previewSource`, `sortOrder`, `isActive`, `isUserVisible`, `createdAt`, `updatedAt`)
VALUES
('style_with_model', 'style_cat_model', 'با مدل', 'نمای محصول روی مدل جوان و شیک، با تمرکز کامل روی خود محصول.', 'Act as a senior jewelry and fashion product photographer. Create a premium product-area image on an elegant young adult human model, generally 25 to 35 years old, choosing hands, wrist, neck, ears, or a partial portrait crop only as appropriate for the product. For women, when hands or wrists are visible, use professional jewelry hand-model hands: slender natural fingers, graceful relaxed posing, neat short-to-medium natural nails, clean cuticles, refined feminine proportions, soft but realistic skin, and elegant wrist posture. Avoid rough, swollen, masculine, aged, dry, cracked, work-worn, overly wrinkled, distorted, or awkward hands. The model should look modern, fresh, refined, and natural; avoid elderly, childlike, teen, overly aged, tired, or heavily wrinkled faces and hands. The jewelry or accessory remains the hero and must match the input exactly: shape, proportions, metal tone, stones, clasp, chain, watch face, engravings, and material finish. Use natural skin texture with visible pores, subtle fine lines, realistic hands, neck, ears, and skin tone variation. Avoid waxy, porcelain, airbrushed, doll-like, plastic, or AI-smoothed skin. Tasteful, non-sexual, refined, realistic, and product-first.', '/images/placeholders/jewelry/style-editorial.webp', 'placeholder', 10, true, true, NOW(3), NOW(3)),
('style_clean_white', 'style_cat_catalog', 'پس زمینه', 'خروجی تمیز و محصول محور با انتخاب نوع و رنگ پس زمینه برای فروشگاه و کاتالوگ.', 'Act as a senior jewelry catalog photographer. Create a clean premium product photograph on a smooth, flat, seamless studio background selected by the user. The background must stay simple, even, and product-only: no visible folds, waves, draped fabric, cushions, props, decorative set design, steps, slabs, hard horizon lines, busy textures, or lifestyle styling. Use only subtle natural contact shadows under the product. Default to a simple soft white background when no background controls are provided. The input product is the absolute reference: preserve the exact shape, proportions, metal color, stone count and placement, chain or clasp design, engravings, texture, and visible imperfections. Use softbox studio lighting, realistic metal reflections, crisp but not over-sharpened detail, and true-to-life color. No CGI, no artificial sparkle, no plastic finish, no extra stones, no redesign, no AI-glossy look.', '/images/placeholders/jewelry/style-minimal.webp', 'placeholder', 20, true, true, NOW(3), NOW(3)),
('style_social_media', 'style_cat_social', 'شبکه اجتماعی', 'تصویر واضح، جذاب و فروش محور برای پست و استوری.', 'Act as a senior commercial art director for premium social commerce jewelry campaigns. Create a polished, high-impact social media product image for posts and stories, clearly distinct from a white catalog photo. Always reserve clean designed negative space for adding short text later: keep the product off-center on one side or lower corner, modest in scale, and leave the opposite side open and uncluttered. Use a designed tonal editorial background with refined lighting, subtle depth, tasteful shadow, and campaign-style atmosphere. The background must not be plain white, pure white, empty catalog white, or a generic e-commerce cutout unless the user explicitly selected a white-background style. Keep the product readable but not oversized: avoid a huge centered close-up, avoid edge-to-edge product crops, and generally keep the product closer to campaign scale than catalog hero scale so the composition has room to breathe. Keep the composition modern, sales-ready, and visually engaging, but still minimal and premium. Preserve the exact product from the input: shape, proportions, color, metal finish, stones, chain or clasp, watch face, engravings, and small details. Make it eye-catching without looking synthetic. No AI gloss, no fake sparkle, no over-saturated color, no distracting props, no perfume/fragrance styling, no redesign, no altered materials.', '/images/placeholders/jewelry/style-natural.webp', 'placeholder', 30, true, true, NOW(3), NOW(3)),
('style_soft_editorial', 'style_cat_editorial', 'ادیتوریال', 'فضای مجله ای، خوش استایل و آرام برای تصویر برندمحور.', 'Act as an editorial still-life jewelry photographer. Create a magazine-style product image with refined composition, considered styling, calm premium surfaces, gentle depth, and product-first luxury direction. Preserve the exact input product identity: shape, scale, material, metal color, stones, clasps, chain details, engravings, and visible craftsmanship. Use realistic reflections, tasteful negative space, and an understated editorial mood. No over-polished AI look, no creamy blur hiding details, no fake props overpowering the product, no redesign, no added or missing parts.', '/images/placeholders/jewelry/style-natural.webp', 'placeholder', 40, true, true, NOW(3), NOW(3)),
('style_dramatic_dark', 'style_cat_cinematic', 'سینماتیک', 'نورپردازی نمایشی و لوکس با کنتراست کنترل شده و جزئیات واضح.', 'Act as a professional jewelry advertising photographer. Create a cinematic premium product shot with controlled contrast, precise rim light, deep elegant shadows, atmospheric depth, and realistic highlights. The lighting may feel dramatic, but the product must stay readable and faithful to the input: preserve silhouette, proportions, metal color, gemstone layout, chain or clasp, watch face, engravings, surface texture, and small design details. Make the scene cinematic but physically believable. Avoid crushed details, exaggerated sparkle, CGI render style, plastic surfaces, distorted geometry, added parts, or any redesign.', '/images/placeholders/jewelry/style-dark.webp', 'placeholder', 50, true, true, NOW(3), NOW(3)),
('style_sample_reference', 'style_cat_editorial', 'عکس نمونه', 'جایگذاری محصول داخل چیدمان، نور و حال وهوای یک نمونه انتخاب شده.', 'Create a premium product image by using the user product photo as the strict product identity and the selected sample/reference image only as the source for arrangement, lighting, color mood, product angle, camera perspective, surface styling, and background. Replace the subject/product in the sample with the user product. Match the sample product angle and perspective as closely as possible while preserving the user product form, metal, stones, engravings, details, proportions, silhouette, material finish, and identity exactly. Do not copy or retain the sample product identity. Keep the final image product-first, realistic, editorial, premium, and not a plain white catalog cutout unless the sample clearly requires that mood.', '/images/placeholders/jewelry/style-natural.webp', 'placeholder', 60, true, true, NOW(3), NOW(3)),
('style_warm_luxury', 'style_cat_luxury', 'دکور انتزاعی', 'سبک قدیمی آرشیوشده؛ در جریان کاربر نمایش داده نمی شود.', 'Archived abstract decor style. Keep inactive for user-facing generation.', '/images/placeholders/jewelry/style-gold.webp', 'placeholder', 90, true, false, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `categoryId` = VALUES(`categoryId`),
  `name` = VALUES(`name`),
  `description` = VALUES(`description`),
  `prompt` = VALUES(`prompt`),
  `previewImageUrl` = VALUES(`previewImageUrl`),
  `previewSource` = VALUES(`previewSource`),
  `sortOrder` = VALUES(`sortOrder`),
  `isActive` = VALUES(`isActive`),
  `isUserVisible` = VALUES(`isUserVisible`),
  `updatedAt` = NOW(3);

UPDATE `CreativeStyle`
SET `isUserVisible` = false, `sortOrder` = 90, `updatedAt` = NOW(3)
WHERE `id` NOT IN (
  'style_with_model',
  'style_clean_white',
  'style_social_media',
  'style_soft_editorial',
  'style_dramatic_dark',
  'style_sample_reference',
  'style_warm_luxury'
);

UPDATE `StyleControl`
SET `isActive` = false, `updatedAt` = NOW(3);

INSERT INTO `StyleControl`
  (`id`, `styleId`, `key`, `label`, `type`, `optionsJson`, `defaultValue`, `minValue`, `maxValue`, `sortOrder`, `isActive`, `createdAt`, `updatedAt`)
VALUES
('control_model_gender', 'style_with_model', 'modelGender', 'جنسیت مدل', 'CHOICE', '[{"value":"woman","label":"زن"},{"value":"man","label":"مرد"}]', 'woman', NULL, NULL, 10, true, NOW(3), NOW(3)),
('control_modesty', 'style_with_model', 'modesty', 'پوشیدگی', 'RANGE', NULL, '65', 0, 90, 20, true, NOW(3), NOW(3)),
('control_background_type', 'style_clean_white', 'backgroundType', 'نوع پس زمینه', 'CHOICE', '[{"value":"simple","label":"ساده"},{"value":"fabric","label":"پارچه"},{"value":"leather","label":"چرم"},{"value":"stone","label":"سنگ"},{"value":"paper","label":"کاغذ استودیویی"}]', 'simple', NULL, NULL, 10, true, NOW(3), NOW(3)),
('control_background_color', 'style_clean_white', 'backgroundColor', 'رنگ پس زمینه', 'CHOICE', '[{"value":"white","label":"سفید نرم"},{"value":"cream","label":"کرم شامپاینی"},{"value":"lightGray","label":"طوسی روشن"},{"value":"blush","label":"رز خیلی ملایم"},{"value":"navy","label":"سرمه ای"},{"value":"charcoal","label":"ذغالی"},{"value":"softBlack","label":"مشکی نرم"},{"value":"forest","label":"سبز تیره"},{"value":"burgundy","label":"زرشکی تیره"},{"value":"espresso","label":"قهوه ای اسپرسو"}]', 'white', NULL, NULL, 20, true, NOW(3), NOW(3)),
('control_social_background_tone', 'style_social_media', 'socialBackgroundTone', 'پس زمینه', 'CHOICE', '[{"value":"light","label":"روشن"},{"value":"dark","label":"تیره"}]', 'light', NULL, NULL, 10, true, NOW(3), NOW(3)),
('control_social_text_placement', 'style_social_media', 'socialTextPlacement', 'جای متن', 'CHOICE', '[{"value":"right","label":"راست"},{"value":"left","label":"چپ"},{"value":"top","label":"بالا"},{"value":"bottom","label":"پایین"}]', 'right', NULL, NULL, 20, true, NOW(3), NOW(3)),
('control_editorial_mood', 'style_soft_editorial', 'editorialMood', 'حال وهوای مجله ای', 'CHOICE', '[{"value":"calm","label":"آرام"},{"value":"luxury","label":"لوکس"},{"value":"bold","label":"جسور"}]', 'calm', NULL, NULL, 10, true, NOW(3), NOW(3)),
('control_editorial_depth', 'style_soft_editorial', 'depthOfField', 'عمق میدان', 'RANGE', NULL, '45', 0, 100, 20, true, NOW(3), NOW(3)),
('control_cinematic_contrast', 'style_dramatic_dark', 'contrastIntensity', 'شدت کنتراست', 'RANGE', NULL, '65', 0, 100, 10, true, NOW(3), NOW(3)),
('control_cinematic_dark_background', 'style_dramatic_dark', 'darkBackground', 'پس زمینه تیره', 'BOOLEAN', NULL, 'true', NULL, NULL, 20, true, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `label` = VALUES(`label`),
  `type` = VALUES(`type`),
  `optionsJson` = VALUES(`optionsJson`),
  `defaultValue` = VALUES(`defaultValue`),
  `minValue` = VALUES(`minValue`),
  `maxValue` = VALUES(`maxValue`),
  `sortOrder` = VALUES(`sortOrder`),
  `isActive` = VALUES(`isActive`),
  `updatedAt` = NOW(3);
