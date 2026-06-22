UPDATE `CreativeStyle`
SET
  `prompt` = 'Act as a senior jewelry product photographer using a sample image as art direction only. Create a premium product-only image where the user product photo is the locked product identity. Borrow only the sample image broad lighting, color mood, surface/background language, material atmosphere, and camera feel. Do not copy the sample product, hand, wrist, body, pose, model, clothing, or lifestyle subject. Do not force the user product into a sample pose if doing so would alter product shape, stones, metal, engravings, proportions, or material finish. Preserve product identity over sample matching every time.',
  `description` = 'الهام از نور، فضا و حس عکس نمونه بدون کپی سوژه یا تغییر هویت محصول.'
WHERE `id` = 'style_sample_reference';
