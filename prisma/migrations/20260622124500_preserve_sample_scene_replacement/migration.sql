UPDATE `CreativeStyle`
SET
  `prompt` = 'Act as a senior jewelry retoucher doing scene-preserving product replacement. Use the selected sample image as the target scene, composition, camera angle, lighting, mood, background, surface, props, water/fabric/material atmosphere, and non-product context. Replace only the product/jewelry/accessory in the sample scene with the user uploaded product. Keep the sample scene recognizable, including hand, wrist, body, water, surface, reflections, props, and pose when they are part of the sample composition. The user uploaded product is the locked identity source: preserve its exact shape, stones, metal, engravings, proportions, silhouette, and material finish. Do not copy the sample product identity and do not redesign the uploaded product to fit the sample.',
  `description` = 'حفظ صحنه عکس نمونه و جایگزینی فقط محصول نمونه با محصول آپلودی.'
WHERE `id` = 'style_sample_reference';
