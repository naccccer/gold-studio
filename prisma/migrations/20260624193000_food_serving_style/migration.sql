INSERT INTO `StyleCategory` (`id`, `slug`, `vertical`, `name`, `sortOrder`, `createdAt`, `updatedAt`) VALUES
('food_style_cat_serving', 'food-serving-vessel', 'food', 'ظرف و سروینگ', 20, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `vertical` = VALUES(`vertical`),
  `slug` = VALUES(`slug`),
  `name` = VALUES(`name`),
  `sortOrder` = VALUES(`sortOrder`),
  `updatedAt` = NOW(3);

UPDATE `StyleCategory`
SET `name` = 'منو و پس‌زمینه ساده',
    `sortOrder` = 10,
    `updatedAt` = NOW(3)
WHERE `id` = 'food_style_cat_catalog';

UPDATE `StyleCategory`
SET `sortOrder` = 30, `updatedAt` = NOW(3)
WHERE `id` = 'food_style_cat_sample';

UPDATE `StyleCategory`
SET `sortOrder` = 40, `updatedAt` = NOW(3)
WHERE `id` = 'food_style_cat_social';

UPDATE `StyleCategory`
SET `sortOrder` = 50, `updatedAt` = NOW(3)
WHERE `id` = 'food_style_cat_natural';

UPDATE `StyleCategory`
SET `sortOrder` = 60, `updatedAt` = NOW(3)
WHERE `id` = 'food_style_cat_packaging';

UPDATE `CreativeStyle`
SET
  `categoryId` = 'food_style_cat_catalog',
  `name` = 'منو / پس‌زمینه ساده',
  `description` = 'خروجی تمیز، خوانا و آماده اسنپ‌فود، سایت، کاتالوگ و منوی آنلاین.',
  `prompt` = 'Act as a senior restaurant menu, catalog, and clean-background photographer. Create a clean, appetizing food or drink item photo suitable for Snappfood-style menus, delivery apps, website menus, catalog grids, and simple online-sales backgrounds. Remove distracting source-photo clutter and restage the uploaded item on a simple commercial surface such as clean white, light stone, pale wood, matte neutral, or controlled dark neutral. Keep the item readable in square menu thumbnails while still working in 5:4 and 16:9 exports. Use a commercially appropriate angle based on the item type, accurate color, realistic contact shadows, clean plate/package edges, and natural studio lighting. Preserve the uploaded item exactly: dish or drink type, portion, plating, package shape, label placement, garnish, sauce pattern, ingredient layout, texture, color, cup/plate/wrapper/container, and serving size. No text overlays, no people, no hands, no fake logos, no unrelated props, no messy leftovers, no extreme macro crop, no CGI gloss, and do not change the item into a different menu item.',
  `previewImageUrl` = '/images/placeholders/food/food-menu-catalog.webp',
  `previewSource` = 'placeholder',
  `sortOrder` = 10,
  `isActive` = true,
  `isUserVisible` = true,
  `updatedAt` = NOW(3)
WHERE `id` = 'food_style_menu_catalog';

INSERT INTO `CreativeStyle` (`id`, `categoryId`, `vertical`, `name`, `description`, `prompt`, `previewImageUrl`, `previewSource`, `sortOrder`, `isActive`, `isUserVisible`, `createdAt`, `updatedAt`) VALUES
(
  'food_style_serving_vessel',
  'food_style_cat_serving',
  'food',
  'ظرف و سروینگ',
  'تمرکز روی بشقاب، کاسه، لیوان، کاپ، جعبه یا ظرفی که غذا و نوشیدنی داخل آن سرو شده.',
  'Act as a food and beverage serving-styling photographer. Create a premium commercial image that improves the serving vessel and presentation around the uploaded item: plate, bowl, cup, glass, mug, bottle, wrapper, tray, takeaway box, delivery container, saucer, or package. The food or drink remains the hero, but the vessel must look clean, intentional, correctly scaled, and suitable for restaurant/cafe menu and Instagram use. Preserve the uploaded item identity exactly: dish or drink type, portion, plating, vessel shape, rim, cup or glass shape, package/container structure, label placement, garnish, sauce pattern, ingredients, texture, color, fill level, and serving size. Improve only cleanliness, alignment, lighting, contact shadows, surface context, and vessel presentation. No text, no people, no hands, no messy table clutter, no extra dishes or cups, no invented branding, no changing the plate/cup/container into an unrelated style, and no changing the menu item.',
  '/images/placeholders/food/food-restaurant-plate.webp',
  'placeholder',
  20,
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
SET `isUserVisible` = false,
    `sortOrder` = 25,
    `updatedAt` = NOW(3)
WHERE `id` = 'food_style_minimal';

UPDATE `CreativeStyle`
SET `sortOrder` = 30, `updatedAt` = NOW(3)
WHERE `id` = 'food_style_sample_reference';

UPDATE `CreativeStyle`
SET `sortOrder` = 40, `updatedAt` = NOW(3)
WHERE `id` = 'food_style_instagram_social';

UPDATE `CreativeStyle`
SET `sortOrder` = 50, `updatedAt` = NOW(3)
WHERE `id` = 'food_style_ugc_natural';

UPDATE `CreativeStyle`
SET `sortOrder` = 60, `updatedAt` = NOW(3)
WHERE `id` = 'food_style_luxury';

UPDATE `StyleControl`
SET
  `label` = 'سطح / پس‌زمینه',
  `optionsJson` = '[{"value":"white","label":"روشن ساده"},{"value":"stone","label":"سنگ روشن"},{"value":"wood","label":"چوب روشن"},{"value":"dark","label":"تیره تمیز"}]',
  `defaultValue` = 'white',
  `updatedAt` = NOW(3)
WHERE `id` = 'control_food_menu_surface';

UPDATE `StyleControl`
SET `isActive` = false, `updatedAt` = NOW(3)
WHERE `styleId` = 'food_style_minimal';

INSERT INTO `StyleControl` (`id`, `styleId`, `key`, `label`, `type`, `optionsJson`, `defaultValue`, `minValue`, `maxValue`, `sortOrder`, `isActive`, `createdAt`, `updatedAt`) VALUES
('control_food_serving_vessel', 'food_style_serving_vessel', 'foodServingVessel', 'نوع ظرف', 'CHOICE', '[{"value":"auto","label":"خودکار"},{"value":"plate","label":"بشقاب"},{"value":"bowl","label":"کاسه"},{"value":"cupGlass","label":"لیوان / کاپ"},{"value":"takeaway","label":"ظرف بیرون‌بر"}]', 'auto', NULL, NULL, 10, true, NOW(3), NOW(3)),
('control_food_vessel_focus', 'food_style_serving_vessel', 'foodVesselFocus', 'تاکید روی ظرف', 'RANGE', NULL, '55', 0, 100, 20, true, NOW(3), NOW(3))
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

UPDATE `CreativeStyle`
SET `isUserVisible` = false, `updatedAt` = NOW(3)
WHERE `vertical` = 'food'
  AND `id` NOT IN (
    'food_style_menu_catalog',
    'food_style_serving_vessel',
    'food_style_sample_reference',
    'food_style_instagram_social',
    'food_style_ugc_natural',
    'food_style_luxury'
  );
