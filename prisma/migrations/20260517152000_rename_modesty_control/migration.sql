UPDATE `StyleControl`
SET
  `label` = 'پوشیدگی',
  `updatedAt` = NOW(3)
WHERE `styleId` = 'style_with_model'
  AND `key` = 'modesty';
