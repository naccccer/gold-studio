INSERT INTO `StyleCategory` (`id`, `slug`, `name`, `sortOrder`, `createdAt`, `updatedAt`) VALUES
('style_cat_abstract', 'abstract-decor', 'دکور انتزاعی', 30, NOW(3), NOW(3)),
('style_cat_cinematic', 'cinematic', 'سینماتیک', 60, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `sortOrder` = VALUES(`sortOrder`),
  `updatedAt` = NOW(3);

UPDATE `StyleCategory`
SET
  `name` = 'پس‌زمینه سفید',
  `sortOrder` = 20,
  `updatedAt` = NOW(3)
WHERE `id` = 'style_cat_catalog';

UPDATE `StyleCategory`
SET
  `name` = 'با مدل',
  `sortOrder` = 10,
  `updatedAt` = NOW(3)
WHERE `id` = 'style_cat_model';

UPDATE `StyleCategory`
SET
  `name` = 'ادیتوریال',
  `sortOrder` = 50,
  `updatedAt` = NOW(3)
WHERE `id` = 'style_cat_editorial';

UPDATE `StyleCategory`
SET
  `name` = 'شبکه اجتماعی',
  `sortOrder` = 40,
  `updatedAt` = NOW(3)
WHERE `id` = 'style_cat_social';

UPDATE `StyleCategory`
SET
  `name` = 'آرشیو',
  `sortOrder` = 90,
  `updatedAt` = NOW(3)
WHERE `id` = 'style_cat_luxury';

UPDATE `CreativeStyle`
SET
  `categoryId` = 'style_cat_model',
  `name` = 'با مدل',
  `description` = 'نمای محصول روی مدل جوان و شیک، با تمرکز کامل روی خود محصول.',
  `prompt` = 'Act as a senior jewelry and fashion product photographer. Create a premium product-area image on an elegant young adult human model, generally 25 to 35 years old, choosing hands, wrist, neck, ears, or a partial portrait crop only as appropriate for the product. The model should look modern, fresh, refined, and natural; avoid elderly, childlike, teen, overly aged, tired, or heavily wrinkled faces and hands. The jewelry or accessory remains the hero and must match the input exactly: shape, proportions, metal tone, stones, clasp, chain, watch face, engravings, and material finish. Use natural skin texture with visible pores, subtle fine lines, realistic hands, neck, ears, and skin tone variation. Avoid waxy, porcelain, airbrushed, doll-like, plastic, or AI-smoothed skin. Tasteful, non-sexual, refined, realistic, and product-first.',
  `previewImageUrl` = '/images/placeholders/jewelry/style-editorial.webp',
  `previewSource` = 'placeholder',
  `sortOrder` = 10,
  `isActive` = true,
  `isUserVisible` = true,
  `updatedAt` = NOW(3)
WHERE `id` = 'style_with_model';

UPDATE `CreativeStyle`
SET
  `categoryId` = 'style_cat_catalog',
  `name` = 'پس‌زمینه سفید',
  `description` = 'خروجی تمیز و دقیق برای فروشگاه، کاتالوگ و نمایش حرفه‌ای محصول.',
  `prompt` = 'Act as a senior jewelry product photographer. Create a clean premium catalog product photograph on a pure white or very light neutral background. The input product is the absolute reference: preserve the exact shape, proportions, metal color, stone count and placement, chain or clasp design, engravings, texture, and visible imperfections. Use softbox studio lighting, natural contact shadows, realistic metal reflections, crisp but not over-sharpened detail, and true-to-life color. No CGI, no artificial sparkle, no plastic finish, no extra stones, no redesign, no AI-glossy look.',
  `previewImageUrl` = '/images/placeholders/jewelry/style-minimal.webp',
  `previewSource` = 'placeholder',
  `sortOrder` = 20,
  `isActive` = true,
  `isUserVisible` = true,
  `updatedAt` = NOW(3)
WHERE `id` = 'style_clean_white';

UPDATE `CreativeStyle`
SET
  `categoryId` = 'style_cat_abstract',
  `name` = 'دکور انتزاعی',
  `description` = 'چیدمان مینیمال با حجم‌ها، سایه‌ها و سطوح مدرن بدون شلوغی.',
  `prompt` = 'Act as a premium still-life jewelry photographer and set designer. Create a refined abstract decor product image using minimal geometric forms, sculptural surfaces, soft shadows, and elegant negative space. The decor should feel modern, premium, and quiet, never busy. Keep the product as the clear hero and preserve the exact input identity: silhouette, proportions, metal tone, gemstone layout, clasp, chain, watch face, engravings, texture, and small design details. Use realistic optics, believable contact shadows, and restrained luxury styling. No clutter, no floral or perfume-like metaphors, no fake sparkle, no CGI look, no added or missing product parts, no redesign.',
  `previewImageUrl` = '/images/placeholders/jewelry/style-gold.webp',
  `previewSource` = 'placeholder',
  `sortOrder` = 30,
  `isActive` = true,
  `isUserVisible` = true,
  `updatedAt` = NOW(3)
WHERE `id` = 'style_warm_luxury';

UPDATE `CreativeStyle`
SET
  `categoryId` = 'style_cat_social',
  `name` = 'شبکه اجتماعی',
  `description` = 'تصویر واضح، جذاب و فروش‌محور برای پست و استوری.',
  `prompt` = 'Act as a commercial product photographer for premium social commerce. Create a polished, clean, high-impact jewelry product image with strong visual clarity, refined negative space, natural lighting, and a modern sales-ready composition suitable for posts and stories. Preserve the exact product from the input: shape, proportions, color, metal finish, stones, chain or clasp, watch face, engravings, and small details. Make it eye-catching without looking synthetic. No AI gloss, no fake sparkle, no over-saturated color, no added props that hide the product, no redesign, no altered materials.',
  `previewImageUrl` = '/images/placeholders/jewelry/style-natural.webp',
  `previewSource` = 'placeholder',
  `sortOrder` = 40,
  `isActive` = true,
  `isUserVisible` = true,
  `updatedAt` = NOW(3)
WHERE `id` = 'style_social_media';

UPDATE `CreativeStyle`
SET
  `categoryId` = 'style_cat_editorial',
  `name` = 'ادیتوریال',
  `description` = 'فضای مجله‌ای، خوش‌استایل و آرام برای تصویر برندمحور.',
  `prompt` = 'Act as an editorial still-life jewelry photographer. Create a magazine-style product image with refined composition, considered styling, calm premium surfaces, gentle depth, and product-first luxury direction. Preserve the exact input product identity: shape, scale, material, metal color, stones, clasps, chain details, engravings, and visible craftsmanship. Use realistic reflections, tasteful negative space, and an understated editorial mood. No over-polished AI look, no creamy blur hiding details, no fake props overpowering the product, no redesign, no added or missing parts.',
  `previewImageUrl` = '/images/placeholders/jewelry/style-natural.webp',
  `previewSource` = 'placeholder',
  `sortOrder` = 50,
  `isActive` = true,
  `isUserVisible` = true,
  `updatedAt` = NOW(3)
WHERE `id` = 'style_soft_editorial';

UPDATE `CreativeStyle`
SET
  `categoryId` = 'style_cat_cinematic',
  `name` = 'سینماتیک',
  `description` = 'نورپردازی نمایشی و لوکس با کنتراست کنترل‌شده و جزئیات واضح.',
  `prompt` = 'Act as a professional jewelry advertising photographer. Create a cinematic premium product shot with controlled contrast, precise rim light, deep elegant shadows, atmospheric depth, and realistic highlights. The lighting may feel dramatic, but the product must stay readable and faithful to the input: preserve silhouette, proportions, metal color, gemstone layout, chain or clasp, watch face, engravings, surface texture, and small design details. Make the scene cinematic but physically believable. Avoid crushed details, exaggerated sparkle, CGI render style, plastic surfaces, distorted geometry, added parts, or any redesign.',
  `previewImageUrl` = '/images/placeholders/jewelry/style-dark.webp',
  `previewSource` = 'placeholder',
  `sortOrder` = 60,
  `isActive` = true,
  `isUserVisible` = true,
  `updatedAt` = NOW(3)
WHERE `id` = 'style_dramatic_dark';

UPDATE `CreativeStyle`
SET
  `isUserVisible` = false,
  `sortOrder` = 90,
  `updatedAt` = NOW(3)
WHERE `id` NOT IN (
  'style_with_model',
  'style_clean_white',
  'style_warm_luxury',
  'style_social_media',
  'style_soft_editorial',
  'style_dramatic_dark'
);

UPDATE `StyleControl`
SET
  `defaultValue` = 'woman',
  `updatedAt` = NOW(3)
WHERE `styleId` = 'style_with_model'
  AND `key` = 'modelGender';

UPDATE `StyleControl`
SET
  `minValue` = 0,
  `maxValue` = 90,
  `defaultValue` = '65',
  `updatedAt` = NOW(3)
WHERE `styleId` = 'style_with_model'
  AND `key` = 'modesty';
