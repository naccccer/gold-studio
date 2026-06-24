INSERT INTO `StyleCategory` (`id`, `slug`, `vertical`, `name`, `sortOrder`, `createdAt`, `updatedAt`) VALUES
('food_style_cat_catalog', 'food-catalog', 'food', 'منو و فروش آنلاین', 10, NOW(3), NOW(3)),
('food_style_cat_background', 'food-background', 'food', 'پس‌زمینه تمیز', 20, NOW(3), NOW(3)),
('food_style_cat_sample', 'food-sample-reference', 'food', 'عکس نمونه', 30, NOW(3), NOW(3)),
('food_style_cat_social', 'food-social', 'food', 'اینستاگرام', 40, NOW(3), NOW(3)),
('food_style_cat_natural', 'food-real-table', 'food', 'چیدمان کافه و رستوران', 50, NOW(3), NOW(3)),
('food_style_cat_packaging', 'food-packaging', 'food', 'بسته‌بندی و بیرون‌بر', 60, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `vertical` = VALUES(`vertical`),
  `slug` = VALUES(`slug`),
  `name` = VALUES(`name`),
  `sortOrder` = VALUES(`sortOrder`),
  `updatedAt` = NOW(3);

INSERT INTO `CreativeStyle` (`id`, `categoryId`, `vertical`, `name`, `description`, `prompt`, `previewImageUrl`, `previewSource`, `sortOrder`, `isActive`, `isUserVisible`, `createdAt`, `updatedAt`) VALUES
(
  'food_style_menu_catalog',
  'food_style_cat_catalog',
  'food',
  'منو / کاتالوگ',
  'خروجی تمیز و قابل‌اعتماد برای اسنپ‌فود، منوی سایت و کاتالوگ آنلاین.',
  'Act as a senior restaurant menu and online-ordering photographer. Create a clean, appetizing food or drink item photo suitable for Snappfood-style menus, delivery apps, website menus, and catalog grids. Keep the item centered enough for square thumbnail crops while still working in 5:4 and 16:9 exports. Use one consistent top-down or 45-degree commercial angle based on the item type, clean plate or package edges, natural studio lighting, accurate color, realistic shadows, and a simple surface such as white, light stone, pale wood, or matte neutral. Preserve the uploaded item exactly: dish or drink type, portion, plating, package shape, label placement, garnish, sauce pattern, ingredient layout, texture, color, cup/plate/wrapper, and serving size. No text overlays, no people, no hands, no fake logos, no unrelated props, no messy leftovers, no extreme macro crop, no CGI gloss, and do not change the item into a different menu item.',
  '/images/placeholders/food/food-menu-catalog.webp',
  'placeholder',
  10,
  true,
  true,
  NOW(3),
  NOW(3)
),
(
  'food_style_minimal',
  'food_style_cat_background',
  'food',
  'پس‌زمینه تمیز',
  'حذف شلوغی عکس خام و ساخت زمینه روشن، سنگی، چوبی یا مات برای فروش آنلاین.',
  'Act as a commercial food retoucher specializing in clean background replacement for restaurants and cafes. Remove distracting source-photo clutter and rebuild the image on a simple premium background such as clean white, light stone, pale wood, stainless counter, or matte neutral surface. Keep the item product-first, readable in a square crop, and suitable for batch menu consistency. Preserve the uploaded food, drink, dessert, cafe item, or package identity exactly: portion, plating, package shape, label area, garnish, sauce pattern, ingredient layout, texture, color, serving vessel, and scale. Add only believable contact shadows and subtle surface context. No text, no people, no hands, no extra dishes or cups, no decorative clutter, no fake brand text, no plastic food, and no changing the menu item.',
  '/images/placeholders/food/food-style-minimal.webp',
  'placeholder',
  20,
  true,
  true,
  NOW(3),
  NOW(3)
),
(
  'food_style_sample_reference',
  'food_style_cat_sample',
  'food',
  'عکس نمونه',
  'جایگذاری غذا یا نوشیدنی داخل نور، زاویه، چیدمان و حال‌وهوای یک نمونه انتخاب‌شده.',
  'Use the uploaded item as the locked food or drink identity and use the selected sample/reference image only for scene, lighting, camera angle, surface styling, composition, and mood. Replace only the sample food, drink, cup, plate, package, or menu item with the uploaded item. Preserve the uploaded item exactly: dish type, drink color, package shape, label placement, portion, plating, garnish, sauce pattern, ingredients, texture, serving vessel, and freshness cues. Do not copy the sample item identity, do not invent labels, and do not change cuisine, flavor, brand, or serving size.',
  '/images/placeholders/food/food-cafe-item.webp',
  'placeholder',
  30,
  true,
  true,
  NOW(3),
  NOW(3)
),
(
  'food_style_instagram_social',
  'food_style_cat_social',
  'food',
  'پست اینستاگرام',
  'قاب جذاب برای پست، استوری یا کمپین با فضای نفس برای متن و پیشنهاد فروش.',
  'Act as a food social-commerce art director for restaurants and cafes. Create a polished Instagram-ready image with a strong hero item, appetizing color, fresh highlights, and intentional negative space for later Persian text, price, offer copy, or story stickers. The scene should feel current, real, and scroll-stopping without looking synthetic. Preserve the uploaded item identity exactly: dish type, drink color, dessert structure, packaging, garnish, portion, label position, serving vessel, and visible ingredients. Use tasteful surface styling, restrained props only when useful, and natural-looking light. No text in the image, no logos, no people, no hands, no over-saturated plastic food, no unrelated props, no giant edge-to-edge macro crop, and no changing the item into another menu item.',
  '/images/placeholders/food/food-drink-social.webp',
  'placeholder',
  40,
  true,
  true,
  NOW(3),
  NOW(3)
),
(
  'food_style_ugc_natural',
  'food_style_cat_natural',
  'food',
  'چیدمان کافه و رستوران',
  'حس میز واقعی، نور طبیعی و اعتمادپذیر برای کافه، رستوران و صفحه اینستاگرام.',
  'Act as a natural food lifestyle photographer for trustworthy restaurant and cafe commerce. Create a believable, lightly styled table scene in a real cafe, restaurant, counter, or dining setting while keeping the item clean, fresh, and sales-ready. Preserve the uploaded item identity: dish type, drink color, dessert layers, package shape, label placement, garnish, ingredients, portion, texture, serving vessel, and scale. Keep lighting natural, colors appetizing, and context restrained; use surfaces, napkins, cutlery, glassware, or cafe table details only when they support the item. No text, no people, no hands, no eaten leftovers, no fake brand, no messy table clutter, and no changing the item into a different food or drink.',
  '/images/placeholders/food/food-dish-natural.webp',
  'placeholder',
  50,
  true,
  true,
  NOW(3),
  NOW(3)
),
(
  'food_style_luxury',
  'food_style_cat_packaging',
  'food',
  'بسته‌بندی آماده فروش',
  'برای جعبه بیرون‌بر، لیوان، بطری، قوطی، بسته آماده و محصول برنددار.',
  'Act as a packaged food and takeaway product photographer. Create a premium online-sales image for packaged food, bottled drinks, cans, cups, takeaway boxes, wrappers, bakery boxes, or branded cafe products. Make the package clean, upright, legible where source text is visible, and commercially useful for menu thumbnails, Instagram posts, and product catalogs. Preserve package shape, visible brand marks without inventing new text, label placement, flavor cues, cap, seal, wrapper folds, fill level, product scale, and any visible food or drink content. Use clean commercial lighting, realistic reflections, and a simple surface or subtle context. No fake logos, no invented claims, no unreadable hallucinated labels, no extra products unless visible in the source, no people, no hands, and no changing the SKU, flavor, package, or drink type.',
  '/images/placeholders/food/food-packaged.webp',
  'placeholder',
  60,
  true,
  true,
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `categoryId` = VALUES(`categoryId`),
  `vertical` = VALUES(`vertical`),
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
SET `isUserVisible` = false, `updatedAt` = NOW(3)
WHERE `vertical` = 'food'
  AND `id` NOT IN (
    'food_style_menu_catalog',
    'food_style_minimal',
    'food_style_sample_reference',
    'food_style_instagram_social',
    'food_style_ugc_natural',
    'food_style_luxury'
  );
