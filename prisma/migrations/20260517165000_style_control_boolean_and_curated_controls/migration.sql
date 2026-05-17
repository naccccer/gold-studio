ALTER TABLE `StyleControl` MODIFY `type` ENUM('CHOICE', 'RANGE', 'BOOLEAN') NOT NULL;

UPDATE `StyleControl`
SET
  `label` = 'پوشیدگی',
  `updatedAt` = NOW(3)
WHERE `styleId` = 'style_with_model'
  AND `key` = 'modesty';

INSERT INTO `StyleControl` (`id`, `styleId`, `key`, `label`, `type`, `optionsJson`, `defaultValue`, `minValue`, `maxValue`, `sortOrder`, `isActive`, `createdAt`, `updatedAt`) VALUES
('control_model_gender', 'style_with_model', 'modelGender', 'جنسیت مدل', 'CHOICE', '[{"value":"woman","label":"زن"},{"value":"man","label":"مرد"}]', 'woman', NULL, NULL, 10, true, NOW(3), NOW(3)),
('control_modesty', 'style_with_model', 'modesty', 'پوشیدگی', 'RANGE', NULL, '65', 0, 90, 20, true, NOW(3), NOW(3)),
('control_white_soft_shadow', 'style_clean_white', 'softShadow', 'سایه نرم', 'RANGE', NULL, '55', 0, 100, 10, true, NOW(3), NOW(3)),
('control_white_surface_reflection', 'style_clean_white', 'surfaceReflection', 'انعکاس سطح', 'BOOLEAN', NULL, 'false', NULL, NULL, 20, true, NOW(3), NOW(3)),
('control_abstract_surface', 'style_warm_luxury', 'decorSurface', 'نوع دکور/سطح', 'CHOICE', '[{"value":"stone","label":"سنگی"},{"value":"geometric","label":"هندسی"},{"value":"silk","label":"پارچه مات"}]', 'stone', NULL, NULL, 10, true, NOW(3), NOW(3)),
('control_abstract_intensity', 'style_warm_luxury', 'decorIntensity', 'شدت دکور', 'RANGE', NULL, '45', 0, 100, 20, true, NOW(3), NOW(3)),
('control_social_text_space', 'style_social_media', 'textSpace', 'فضای خالی برای متن', 'BOOLEAN', NULL, 'true', NULL, NULL, 10, true, NOW(3), NOW(3)),
('control_social_visual_energy', 'style_social_media', 'visualEnergy', 'انرژی بصری', 'RANGE', NULL, '55', 0, 100, 20, true, NOW(3), NOW(3)),
('control_editorial_mood', 'style_soft_editorial', 'editorialMood', 'حال‌وهوای مجله‌ای', 'CHOICE', '[{"value":"calm","label":"آرام"},{"value":"luxury","label":"لوکس"},{"value":"bold","label":"جسور"}]', 'calm', NULL, NULL, 10, true, NOW(3), NOW(3)),
('control_editorial_depth', 'style_soft_editorial', 'depthOfField', 'عمق میدان', 'RANGE', NULL, '45', 0, 100, 20, true, NOW(3), NOW(3)),
('control_cinematic_contrast', 'style_dramatic_dark', 'contrastIntensity', 'شدت کنتراست', 'RANGE', NULL, '65', 0, 100, 10, true, NOW(3), NOW(3)),
('control_cinematic_dark_background', 'style_dramatic_dark', 'darkBackground', 'پس‌زمینه تیره', 'BOOLEAN', NULL, 'true', NULL, NULL, 20, true, NOW(3), NOW(3))
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
