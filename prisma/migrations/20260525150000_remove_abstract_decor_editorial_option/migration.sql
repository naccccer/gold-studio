UPDATE `StyleControl`
SET
  `optionsJson` = '[{"value":"calm","label":"آرام"},{"value":"luxury","label":"لوکس"},{"value":"bold","label":"جسور"}]',
  `defaultValue` = CASE WHEN `defaultValue` = 'abstractDecor' THEN 'calm' ELSE `defaultValue` END,
  `updatedAt` = NOW(3)
WHERE `styleId` = 'style_soft_editorial'
  AND `key` = 'editorialMood';
