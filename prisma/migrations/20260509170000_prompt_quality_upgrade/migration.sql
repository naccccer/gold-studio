UPDATE `CreativeStyle`
SET
  `prompt` = 'Act as a senior jewelry product photographer. Create a clean premium catalog product photograph on a pure white or very light neutral background. The input product is the absolute reference: preserve the exact shape, proportions, metal color, stone count and placement, chain or clasp design, engravings, texture, and visible imperfections. Use softbox studio lighting, natural contact shadows, realistic metal reflections, crisp but not over-sharpened detail, and true-to-life color. No CGI, no artificial sparkle, no plastic finish, no extra stones, no redesign, no AI-glossy look.',
  `updatedAt` = NOW(3)
WHERE `id` = 'style_clean_white';

UPDATE `CreativeStyle`
SET
  `prompt` = 'Act as a senior luxury product photographer. Create a warm premium studio photograph with controlled champagne-gold ambience, refined shadows, and believable reflective surfaces. Keep the product as the hero and preserve its exact identity from the input image: geometry, metal tone, gemstone details, clasp, chain, watch face, engravings, scale, and material finish. Warm the scene, not the product itself; do not turn silver into gold or change stone colors. Natural optics, high-end editorial lighting, realistic texture, no CGI, no fake luxury glow, no AI sheen.',
  `updatedAt` = NOW(3)
WHERE `id` = 'style_warm_luxury';

UPDATE `CreativeStyle`
SET
  `prompt` = 'Act as a professional jewelry advertising photographer. Create a dramatic dark-background studio product shot with controlled contrast, precise rim light, deep elegant shadows, and realistic highlights. The product must match the input exactly: preserve silhouette, proportions, metal color, gemstone layout, chain or clasp, watch face, engravings, surface texture, and small design details. Make the lighting cinematic but physically believable. Avoid crushed details, exaggerated sparkle, CGI render style, plastic surfaces, distorted geometry, added parts, or any redesign.',
  `updatedAt` = NOW(3)
WHERE `id` = 'style_dramatic_dark';

UPDATE `CreativeStyle`
SET
  `prompt` = 'Act as an editorial still-life jewelry photographer. Create a soft natural magazine-style product image with refined composition, calm neutral surfaces, gentle shadows, and product-first luxury styling. Preserve the exact input product identity: shape, scale, material, metal color, stones, clasps, chain details, engravings, and visible craftsmanship. Use natural depth, realistic reflections, and premium understated styling. No over-polished AI look, no creamy blur hiding details, no fake props overpowering the product, no redesign, no added or missing parts.',
  `updatedAt` = NOW(3)
WHERE `id` = 'style_soft_editorial';

UPDATE `CreativeStyle`
SET
  `prompt` = 'Act as a senior jewelry and fashion product photographer. Create a premium product-area image on an elegant adult human model, choosing hands, wrist, neck, ears, or a partial portrait crop only as appropriate for the product. The jewelry or accessory remains the hero and must match the input exactly: shape, proportions, metal tone, stones, clasp, chain, watch face, engravings, and material finish. Use natural skin texture with visible pores, fine lines, realistic hands, neck, ears, and skin tone variation. Avoid waxy, porcelain, airbrushed, doll-like, plastic, or AI-smoothed skin. Tasteful, non-sexual, refined, realistic, and product-first.',
  `updatedAt` = NOW(3)
WHERE `id` = 'style_with_model';

UPDATE `CreativeStyle`
SET
  `prompt` = 'Act as a commercial product photographer for premium social commerce. Create a polished, clean, high-impact jewelry product image with strong visual clarity, refined negative space, natural lighting, and a modern sales-ready composition. Preserve the exact product from the input: shape, proportions, color, metal finish, stones, chain or clasp, watch face, engravings, and small details. Make it eye-catching without looking synthetic. No AI gloss, no fake sparkle, no over-saturated color, no added props that hide the product, no redesign, no altered materials.',
  `updatedAt` = NOW(3)
WHERE `id` = 'style_social_media';

UPDATE `StyleControl`
SET
  `minValue` = 0,
  `maxValue` = 90,
  `defaultValue` = '65',
  `updatedAt` = NOW(3)
WHERE `styleId` = 'style_with_model'
  AND `key` = 'modesty';
