UPDATE `StyleControl`
SET
  `isActive` = false,
  `updatedAt` = NOW(3)
WHERE `styleId` = 'style_social_media'
  AND `key` = 'visualEnergy';

INSERT INTO `StyleControl` (`id`, `styleId`, `key`, `label`, `type`, `optionsJson`, `defaultValue`, `minValue`, `maxValue`, `sortOrder`, `isActive`, `createdAt`, `updatedAt`) VALUES
('control_social_text_placement', 'style_social_media', 'socialTextPlacement', 'جای متن', 'CHOICE', '[{"value":"right","label":"راست"},{"value":"left","label":"چپ"},{"value":"top","label":"بالا"},{"value":"bottom","label":"پایین"}]', 'right', NULL, NULL, 20, true, NOW(3), NOW(3))
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
