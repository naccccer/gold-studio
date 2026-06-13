UPDATE `CreativeStyle`
SET
  `description` = 'نمای محصول روی مدل با تنظیمات قابل انتخاب برای ظاهر، کادر، پوشش و فضای عکس.',
  `prompt` = 'Act as a senior jewelry and fashion product photographer. Create a product-area image on an adult human model, generally 25 to 35 years old, using hands, wrist, neck, ears, or a portrait crop only as appropriate for the selected controls and product. The jewelry or accessory remains the commercial hero and must match the input product exactly in visible identity: shape, proportions, metal tone, stones, chain, watch face, engravings, material finish, and front-facing design details. Use natural skin texture with visible pores, subtle fine lines, realistic hands, neck, ears, and skin tone variation. Avoid waxy, porcelain, airbrushed, doll-like, plastic, or AI-smoothed skin. Keep the image tasteful, non-sexual, realistic, and product-first.'
WHERE `id` = 'style_with_model';

UPDATE `StyleControl`
SET `isActive` = false, `updatedAt` = NOW(3)
WHERE `styleId` = 'style_with_model'
  AND `key` = 'modesty';

INSERT INTO `StyleControl` (`id`, `styleId`, `key`, `label`, `type`, `optionsJson`, `defaultValue`, `minValue`, `maxValue`, `sortOrder`, `isActive`, `createdAt`, `updatedAt`) VALUES
('control_model_gender', 'style_with_model', 'modelGender', 'جنسیت مدل', 'CHOICE', '[{"value":"woman","label":"زن"},{"value":"man","label":"مرد"}]', 'woman', NULL, NULL, 10, true, NOW(3), NOW(3)),
('control_model_nationality', 'style_with_model', 'modelNationality', 'ملیت/ظاهر', 'CHOICE', '[{"value":"iranian","label":"ایرانی"},{"value":"middleEastern","label":"خاورمیانه‌ای"},{"value":"european","label":"اروپایی"}]', 'iranian', NULL, NULL, 20, true, NOW(3), NOW(3)),
('control_face_framing', 'style_with_model', 'faceFraming', 'کادر چهره', 'CHOICE', '[{"value":"productArea","label":"ناحیه محصول"},{"value":"partialFace","label":"نیم‌چهره"},{"value":"fullFace","label":"چهره کامل"}]', 'productArea', NULL, NULL, 30, true, NOW(3), NOW(3)),
('control_model_scene_style', 'style_with_model', 'modelSceneStyle', 'فضای عکس', 'CHOICE', '[{"value":"amateurHome","label":"خانگی آماتور"},{"value":"studio","label":"استودیویی"},{"value":"outdoor","label":"فضای بیرون"}]', 'studio', NULL, NULL, 40, true, NOW(3), NOW(3)),
('control_full_hijab', 'style_with_model', 'fullHijab', 'حجاب کامل', 'BOOLEAN', NULL, 'false', NULL, NULL, 50, true, NOW(3), NOW(3))
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
