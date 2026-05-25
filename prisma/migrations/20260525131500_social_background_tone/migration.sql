UPDATE `StyleControl`
SET
  `isActive` = false,
  `updatedAt` = NOW(3)
WHERE `styleId` = 'style_social_media'
  AND `key` = 'textSpace';

INSERT INTO `StyleControl` (`id`, `styleId`, `key`, `label`, `type`, `optionsJson`, `defaultValue`, `minValue`, `maxValue`, `sortOrder`, `isActive`, `createdAt`, `updatedAt`) VALUES
('control_social_background_tone', 'style_social_media', 'socialBackgroundTone', 'پس‌زمینه', 'CHOICE', '[{"value":"light","label":"روشن"},{"value":"dark","label":"تیره"}]', 'light', NULL, NULL, 10, true, NOW(3), NOW(3))
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
  `sortOrder` = 20,
  `updatedAt` = NOW(3)
WHERE `styleId` = 'style_social_media'
  AND `key` = 'visualEnergy';

UPDATE `CreativeStyle`
SET
  `prompt` = 'Act as a senior commercial art director for premium social commerce jewelry campaigns. Create a polished, high-impact social media product image for posts and stories, clearly distinct from a white catalog photo. Always reserve clean designed negative space for adding short text later: keep the product off-center on one side or lower corner, modest in scale, and leave the opposite side open and uncluttered. Use a designed tonal editorial background with refined lighting, subtle depth, tasteful shadow, and campaign-style atmosphere. The background must not be plain white, pure white, empty catalog white, or a generic e-commerce cutout unless the user explicitly selected a white-background style. Keep the product readable but not oversized: avoid a huge centered close-up, avoid edge-to-edge product crops, and generally keep the product closer to campaign scale than catalog hero scale so the composition has room to breathe. Keep the composition modern, sales-ready, and visually engaging, but still minimal and premium. Preserve the exact product from the input: shape, proportions, color, metal finish, stones, chain or clasp, watch face, engravings, and small details. Make it eye-catching without looking synthetic. No AI gloss, no fake sparkle, no over-saturated color, no distracting props, no perfume/fragrance styling, no redesign, no altered materials.',
  `updatedAt` = NOW(3)
WHERE `id` = 'style_social_media';
