UPDATE `CreativeStyle`
SET
  `prompt` = 'Create a premium product image by using the user product photo as the strict product identity and the selected sample/reference image only as the source for arrangement, lighting, color mood, product angle, camera perspective, surface styling, and background. Replace the subject/product in the sample with the user product. Match the sample product angle and perspective as closely as possible while preserving the user product form, metal, stones, engravings, details, proportions, silhouette, material finish, and identity exactly. Do not copy or retain the sample product identity. Keep the final image product-first, realistic, editorial, premium, and not a plain white catalog cutout unless the sample clearly requires that mood.',
  `updatedAt` = NOW(3)
WHERE `id` = 'style_sample_reference';
