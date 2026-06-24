INSERT INTO `StyleCategory` (`id`, `slug`, `vertical`, `name`, `sortOrder`, `createdAt`, `updatedAt`) VALUES
('food_style_cat_catalog', 'food-catalog', 'food', 'منو و کاتالوگ', 10, NOW(3), NOW(3)),
('food_style_cat_social', 'food-social', 'food', 'شبکه اجتماعی', 20, NOW(3), NOW(3)),
('food_style_cat_minimal', 'food-minimal', 'food', 'مینیمال', 30, NOW(3), NOW(3)),
('food_style_cat_luxury', 'food-luxury', 'food', 'لوکس', 40, NOW(3), NOW(3)),
('food_style_cat_natural', 'food-natural', 'food', 'طبیعی', 50, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `vertical` = VALUES(`vertical`),
  `name` = VALUES(`name`),
  `sortOrder` = VALUES(`sortOrder`),
  `updatedAt` = NOW(3);

INSERT INTO `CreativeStyle` (`id`, `categoryId`, `vertical`, `name`, `description`, `prompt`, `previewImageUrl`, `previewSource`, `sortOrder`, `isActive`, `isUserVisible`, `createdAt`, `updatedAt`) VALUES
(
  'food_style_menu_catalog',
  'food_style_cat_catalog',
  'food',
  'منو / کاتالوگ',
  'خروجی تمیز و اشتهابرانگیز برای منو، اسنپ‌فود، سایت و کاتالوگ.',
  'Act as a senior food menu and catalog photographer. Create a clean appetizing food or drink product image suitable for menus, delivery apps, websites, and catalog use. Keep the dish, drink, dessert, cafe item, restaurant plate, or packaged item faithful to the uploaded source: preserve portion shape, plating, packaging, label placement, garnish, color, texture, and recognizable ingredients. Use controlled natural-looking studio light, clean surface styling, readable composition, realistic shadows, and true-to-life freshness. No text, no logo invention, no fake brand, no people, no hands, no messy leftovers, no artificial CGI gloss, and do not turn the item into a different food or drink.',
  '/images/placeholders/food/food-menu-catalog.webp',
  'placeholder',
  10,
  true,
  true,
  NOW(3),
  NOW(3)
),
(
  'food_style_instagram_social',
  'food_style_cat_social',
  'food',
  'اینستاگرام / شبکه اجتماعی',
  'قاب جذاب و آماده انتشار با فضای نفس برای کپشن یا نوشته بعدی.',
  'Act as a food social-commerce art director. Create a polished Instagram-ready food or drink image with appetizing color, clear hero subject, and intentional negative space for later text placement. The output should feel modern, fresh, and scroll-stopping without looking synthetic. Preserve the uploaded item identity exactly: dish type, drink color, dessert structure, packaging, garnish, portion, label position, and visible ingredients. Use tasteful surface styling and natural highlights. No text in the image, no logos, no people, no hands, no over-saturated plastic food, no unrelated props, and no changing the item into another menu item.',
  '/images/placeholders/food/food-drink-social.webp',
  'placeholder',
  20,
  true,
  true,
  NOW(3),
  NOW(3)
),
(
  'food_style_minimal',
  'food_style_cat_minimal',
  'food',
  'مینیمال',
  'نور روشن، سطح ساده و تمرکز کامل روی غذا یا نوشیدنی.',
  'Act as a minimal food studio photographer. Create a calm clean food or drink product image on a simple premium surface with restrained styling, soft realistic shadows, and strong readability. Preserve the source item identity: plating, texture, ingredients, package shape, label area, drink opacity, dessert layers, garnish, and serving size. Keep the scene uncluttered and product-first. No text, no people, no hands, no extra dishes, no busy props, no sterile CGI look, and no changing the item into another dish, drink, dessert, or package.',
  '/images/placeholders/food/food-style-minimal.webp',
  'placeholder',
  30,
  true,
  true,
  NOW(3),
  NOW(3)
),
(
  'food_style_luxury',
  'food_style_cat_luxury',
  'food',
  'لوکس',
  'چیدمان رستورانی پرمیوم با نورپردازی کنترل‌شده و عمق بیشتر.',
  'Act as a luxury restaurant food photographer. Create a premium editorial food or drink image with refined lighting, rich but believable contrast, elegant shadows, and high-end restaurant styling. Keep the uploaded item locked: preserve plating structure, portion, garnish, sauce placement, cooked surface texture, drink color, dessert layers, package shape, and label placement. Make the result premium and appetizing while staying physically realistic. No text, no people, no hands, no alcohol cues, no invented logo, no excessive props, no fake steam overload, and no changing the item identity.',
  '/images/placeholders/food/food-style-luxury.webp',
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
  'طبیعی / UGC',
  'حس واقعی کافه یا رستوران، طبیعی و قابل اعتماد اما مرتب.',
  'Act as a natural food lifestyle photographer for trustworthy UGC-style commerce. Create a believable fresh food or drink image that feels lightly styled in a real cafe, restaurant, kitchen, or table setting while remaining clean and sales-ready. Preserve the uploaded item identity: dish type, drink color, dessert layers, package shape, label placement, garnish, ingredients, portion, and texture. Keep lighting natural, colors appetizing, and context restrained. No text, no people, no hands, no messy eaten food, no fake brand, no unrelated lifestyle clutter, and no changing the item into a different food or drink.',
  '/images/placeholders/food/food-dish-natural.webp',
  'placeholder',
  50,
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

