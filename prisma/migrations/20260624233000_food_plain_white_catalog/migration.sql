UPDATE `CreativeStyle`
SET
  `prompt` = 'Act as a senior restaurant menu, catalog, and clean-background photographer. Create a clean, appetizing food or drink item photo suitable for Snappfood-style menus, delivery apps, website menus, catalog grids, marketplace listings, and simple online-sales backgrounds. Remove distracting source-photo clutter and restage the uploaded item according to the selected surface/background control. When the selected surface is white or simple/bright, use a plain pure-white or clean soft-white empty seamless catalog background, not a visible tabletop or material surface. For non-white selections, use only the requested clean light stone, pale wood, matte neutral, or controlled dark neutral surface. Keep the item readable in square menu thumbnails while still working in 5:4 and 16:9 exports. Use a commercially appropriate angle based on the item type, accurate color, realistic contact shadows, clean plate/package edges, and natural studio lighting. Preserve the uploaded item recognizability: dish or drink type, portion logic, plating, package shape, label placement, garnish, sauce/cream/glaze pattern, key ingredients, texture family, color family, cup/plate/wrapper/container, and serving size. No text overlays, no people, no hands, no fake logos, no unrelated props, no messy leftovers, no extreme macro crop, no CGI gloss, no visible texture on white/simple backgrounds, and do not change the item into a different menu item.',
  `updatedAt` = NOW(3)
WHERE `id` = 'food_style_menu_catalog';

UPDATE `StyleControl`
SET
  `label` = 'سطح / پس‌زمینه',
  `optionsJson` = '[{"value":"white","label":"سفید خالی"},{"value":"stone","label":"سنگ روشن"},{"value":"wood","label":"چوب روشن"},{"value":"dark","label":"تیره تمیز"}]',
  `defaultValue` = 'white',
  `updatedAt` = NOW(3)
WHERE `id` = 'control_food_menu_surface';
