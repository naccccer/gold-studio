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
