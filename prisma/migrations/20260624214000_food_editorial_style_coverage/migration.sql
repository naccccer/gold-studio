UPDATE `StyleCategory`
SET `sortOrder` = 10, `updatedAt` = NOW(3)
WHERE `id` = 'food_style_cat_catalog';

UPDATE `StyleCategory`
SET `sortOrder` = 20, `updatedAt` = NOW(3)
WHERE `id` = 'food_style_cat_serving';

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
SET
  `name` = 'پرمیوم و ادیتوریال',
  `slug` = 'food-premium-editorial',
  `sortOrder` = 60,
  `updatedAt` = NOW(3)
WHERE `id` = 'food_style_cat_packaging';

UPDATE `CreativeStyle`
SET
  `name` = 'عکس نمونه',
  `description` = 'جایگذاری غذا یا نوشیدنی داخل نور، زاویه، چیدمان و زبان بصری یک نمونه انتخاب‌شده؛ از مینیمال و دارک تا آرتیستیک و فاین‌داینینگ.',
  `prompt` = 'Use the uploaded item as the core food or drink identity and use the selected sample/reference image for scene, lighting, camera angle, surface styling, composition, mood, and advertising polish. Recognize the sample photographic language when present: minimal white negative space, dark editorial contrast, art-photography geometry, graphic shadows, fancy drink reflections, fine-dining restraint, clean packaging angles, or simple catalog presentation. Replace the sample food, drink, cup, plate, package, or menu item with the uploaded item while allowing controlled commercial improvements to neatness, freshness, garnish tidiness, sauce/cream/glaze clarity, condensation, plate/cup cleanliness, and surface styling. Preserve the uploaded item category and recognizability: dish or drink type, cuisine/flavor family when visible, package shape, label placement, portion logic, core ingredients, texture, serving vessel, and freshness cues. Do not copy the sample item identity, do not invent labels, and do not change cuisine, flavor, brand, SKU, or turn it into a different menu item.',
  `sortOrder` = 30,
  `updatedAt` = NOW(3)
WHERE `id` = 'food_style_sample_reference';

UPDATE `CreativeStyle`
SET
  `description` = 'قاب تبلیغاتی برای پست، استوری یا کمپین با فضای نفس برای متن، پیشنهاد فروش و چیدمان جذاب‌تر.',
  `prompt` = 'Act as a food social-commerce art director for restaurants and cafes. Create a polished advertising-ready image with appetizing color, clear hero subject, intentional negative space for later Persian text, and a stronger campaign mood when appropriate: fresh, offer-led, premium, cozy, dark editorial, or graphic. The scene may improve commercial appeal through cleaner plating, tidier garnish, more appetizing highlights, restrained supporting props, better surface styling, and controlled freshness cues while keeping the item recognizably the same menu item or packaged product. Preserve the uploaded item category, core ingredients, drink color, dessert structure, package shape, label placement, serving vessel, and portion logic. No text in the image, no fake logos, no people, no hands, no over-saturated plastic food, no unrelated props, no giant edge-to-edge macro crop, and no changing the item into another food, drink, flavor, brand, or SKU.',
  `sortOrder` = 40,
  `updatedAt` = NOW(3)
WHERE `id` = 'food_style_instagram_social';

UPDATE `CreativeStyle`
SET
  `categoryId` = 'food_style_cat_packaging',
  `name` = 'پرمیوم / ادیتوریال',
  `description` = 'برای دارک ادیتوریال، فاین‌داینینگ، آرت فوتوگرافی، نوشیدنی و دسر فَنسی، بسته‌بندی و عکس‌های پرمیوم‌تر.',
  `prompt` = 'Act as a senior premium food, drink, dessert, and packaged-product photographer. Create a high-end commercial image that can lean into dark editorial lighting, fine-dining restraint, minimal art photography, clean graphic shadows, fancy drink or dessert styling, or premium packaging presentation based on the selected direction. Food has controlled advertising freedom: improve neatness, freshness, plating polish, garnish arrangement, sauce/cream/glaze clarity, condensation, cup/plate/package cleanliness, and surface styling where it makes the item more sellable. Preserve the uploaded item category and recognizability: dish or drink type, cuisine/flavor family when visible, package shape, label placement, portion logic, core ingredients, drink color, dessert layers, serving vessel, and visible brand marks without inventing new text. Use realistic optics, believable contact shadows, refined reflections, and restrained props only when useful. No alcohol cues, no fake logos, no invented label claims, no people, no hands, no messy table clutter, no impossible plating, no plastic food, no surreal CGI lighting, and no changing the item into another menu item, flavor, brand, SKU, or drastically different serving size.',
  `previewImageUrl` = '/images/placeholders/food/food-ref-dark-fine-dining.webp',
  `previewSource` = 'placeholder',
  `sortOrder` = 60,
  `isActive` = true,
  `isUserVisible` = true,
  `updatedAt` = NOW(3)
WHERE `id` = 'food_style_luxury';

UPDATE `CreativeStyle`
SET `sortOrder` = 10, `updatedAt` = NOW(3)
WHERE `id` = 'food_style_menu_catalog';

UPDATE `CreativeStyle`
SET `sortOrder` = 20, `updatedAt` = NOW(3)
WHERE `id` = 'food_style_serving_vessel';

UPDATE `CreativeStyle`
SET `sortOrder` = 50, `updatedAt` = NOW(3)
WHERE `id` = 'food_style_ugc_natural';

INSERT INTO `StyleControl` (`id`, `styleId`, `key`, `label`, `type`, `optionsJson`, `defaultValue`, `minValue`, `maxValue`, `sortOrder`, `isActive`, `createdAt`, `updatedAt`) VALUES
('control_food_premium_direction', 'food_style_luxury', 'foodPremiumDirection', 'جهت پرمیوم', 'CHOICE', '[{"value":"darkEditorial","label":"دارک ادیتوریال"},{"value":"minimalArt","label":"مینیمال آرت"},{"value":"fancyDrinkDessert","label":"نوشیدنی / دسر فَنسی"},{"value":"premiumPackaging","label":"بسته‌بندی پرمیوم"}]', 'darkEditorial', NULL, NULL, 10, true, NOW(3), NOW(3)),
('control_food_premium_polish', 'food_style_luxury', 'foodPremiumPolish', 'پرداخت تبلیغاتی', 'RANGE', NULL, '60', 0, 100, 20, true, NOW(3), NOW(3))
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

UPDATE `StyleControl`
SET
  `label` = 'حال‌وهوا',
  `optionsJson` = '[{"value":"fresh","label":"تازه و روشن"},{"value":"offer","label":"پیشنهادی"},{"value":"premium","label":"پرمیوم"},{"value":"darkGraphic","label":"دارک / گرافیکی"}]',
  `updatedAt` = NOW(3)
WHERE `id` = 'control_food_social_mood';

UPDATE `StyleControl`
SET `isActive` = false, `updatedAt` = NOW(3)
WHERE `id` IN ('control_food_package_angle', 'control_food_label_priority');

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

UPDATE `CreativeStyle`
SET
  `previewImageUrl` = CASE `id`
    WHEN 'food_style_menu_catalog' THEN '/images/placeholders/food/food-style-menu-catalog-preview-v2.webp'
    WHEN 'food_style_serving_vessel' THEN '/images/placeholders/food/food-style-serving-vessel-preview-v2.webp'
    WHEN 'food_style_sample_reference' THEN '/images/placeholders/food/food-style-sample-reference-preview-v2.webp'
    WHEN 'food_style_instagram_social' THEN '/images/placeholders/food/food-style-instagram-social-preview-v2.webp'
    WHEN 'food_style_ugc_natural' THEN '/images/placeholders/food/food-style-ugc-natural-preview-v2.webp'
    WHEN 'food_style_luxury' THEN '/images/placeholders/food/food-style-premium-editorial-preview-v2.webp'
    ELSE `previewImageUrl`
  END,
  `previewSource` = 'placeholder',
  `updatedAt` = NOW(3)
WHERE `id` IN (
  'food_style_menu_catalog',
  'food_style_serving_vessel',
  'food_style_sample_reference',
  'food_style_instagram_social',
  'food_style_ugc_natural',
  'food_style_luxury'
);
