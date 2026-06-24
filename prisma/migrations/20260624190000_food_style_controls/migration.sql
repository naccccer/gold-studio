INSERT INTO `StyleControl` (`id`, `styleId`, `key`, `label`, `type`, `optionsJson`, `defaultValue`, `minValue`, `maxValue`, `sortOrder`, `isActive`, `createdAt`, `updatedAt`) VALUES
('control_food_menu_angle', 'food_style_menu_catalog', 'foodMenuAngle', 'زاویه عکس', 'CHOICE', '[{"value":"auto","label":"خودکار"},{"value":"top","label":"از بالا"},{"value":"threeQuarter","label":"۴۵ درجه"},{"value":"front","label":"روبه‌رو"}]', 'auto', NULL, NULL, 10, true, NOW(3), NOW(3)),
('control_food_menu_surface', 'food_style_menu_catalog', 'foodMenuSurface', 'سطح', 'CHOICE', '[{"value":"white","label":"روشن ساده"},{"value":"stone","label":"سنگ روشن"},{"value":"wood","label":"چوب روشن"},{"value":"dark","label":"تیره تمیز"}]', 'white', NULL, NULL, 20, true, NOW(3), NOW(3)),
('control_food_background_surface', 'food_style_minimal', 'foodBackgroundSurface', 'نوع زمینه', 'CHOICE', '[{"value":"seamless","label":"یکدست"},{"value":"stone","label":"سنگ روشن"},{"value":"wood","label":"چوب روشن"},{"value":"counter","label":"کانتر تمیز"}]', 'seamless', NULL, NULL, 10, true, NOW(3), NOW(3)),
('control_food_background_tone', 'food_style_minimal', 'foodBackgroundTone', 'رنگ زمینه', 'CHOICE', '[{"value":"white","label":"سفید نرم"},{"value":"lightGray","label":"طوسی روشن"},{"value":"warm","label":"گرم ملایم"},{"value":"dark","label":"تیره کنترل‌شده"}]', 'white', NULL, NULL, 20, true, NOW(3), NOW(3)),
('control_food_sample_match', 'food_style_sample_reference', 'foodSampleMatch', 'شباهت به نمونه', 'CHOICE', '[{"value":"strict","label":"زیاد"},{"value":"balanced","label":"متعادل"},{"value":"flexible","label":"آزادتر"}]', 'balanced', NULL, NULL, 10, true, NOW(3), NOW(3)),
('control_food_sample_crop', 'food_style_sample_reference', 'foodSampleCrop', 'کادر', 'CHOICE', '[{"value":"preserve","label":"مثل نمونه"},{"value":"square","label":"مناسب پست"},{"value":"close","label":"نزدیک‌تر"}]', 'square', NULL, NULL, 20, true, NOW(3), NOW(3)),
('control_food_social_text_placement', 'food_style_instagram_social', 'foodSocialTextPlacement', 'جای متن', 'CHOICE', '[{"value":"right","label":"راست"},{"value":"left","label":"چپ"},{"value":"top","label":"بالا"},{"value":"bottom","label":"پایین"}]', 'right', NULL, NULL, 10, true, NOW(3), NOW(3)),
('control_food_social_mood', 'food_style_instagram_social', 'foodSocialMood', 'حال‌وهوا', 'CHOICE', '[{"value":"fresh","label":"تازه و روشن"},{"value":"offer","label":"پیشنهادی"},{"value":"premium","label":"پرمیوم"},{"value":"cozy","label":"کافه‌ای گرم"}]', 'fresh', NULL, NULL, 20, true, NOW(3), NOW(3)),
('control_food_scene_context', 'food_style_ugc_natural', 'foodSceneContext', 'فضای عکس', 'CHOICE', '[{"value":"cafeTable","label":"میز کافه"},{"value":"restaurantTable","label":"میز رستوران"},{"value":"counter","label":"کانتر تمیز"},{"value":"takeaway","label":"بیرون‌بر"}]', 'cafeTable', NULL, NULL, 10, true, NOW(3), NOW(3)),
('control_food_prop_level', 'food_style_ugc_natural', 'foodPropLevel', 'میزان جزئیات', 'RANGE', NULL, '35', 0, 100, 20, true, NOW(3), NOW(3)),
('control_food_package_angle', 'food_style_luxury', 'foodPackageAngle', 'زاویه بسته‌بندی', 'CHOICE', '[{"value":"front","label":"روبه‌رو"},{"value":"threeQuarter","label":"سه‌رخ"},{"value":"top","label":"از بالا"},{"value":"hero","label":"قهرمان"}]', 'threeQuarter', NULL, NULL, 10, true, NOW(3), NOW(3)),
('control_food_label_priority', 'food_style_luxury', 'foodLabelPriority', 'اولویت لیبل', 'BOOLEAN', NULL, 'true', NULL, NULL, 20, true, NOW(3), NOW(3))
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
