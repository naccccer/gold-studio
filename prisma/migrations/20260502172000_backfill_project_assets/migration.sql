-- Backfill Gallery assets for projects created before ProductAsset existed.

INSERT INTO `ProductAsset` (
    `id`,
    `userId`,
    `fileUrl`,
    `storageKey`,
    `mimeType`,
    `originalName`,
    `title`,
    `status`,
    `createdAt`,
    `updatedAt`
)
SELECT
    REPLACE(UUID(), '-', ''),
    p.`userId`,
    p.`sourceImageUrl`,
    TRIM(LEADING '/' FROM p.`sourceImageUrl`),
    CASE
        WHEN LOWER(p.`sourceImageUrl`) LIKE '%.png' THEN 'image/png'
        WHEN LOWER(p.`sourceImageUrl`) LIKE '%.webp' THEN 'image/webp'
        ELSE 'image/jpeg'
    END,
    NULL,
    p.`title`,
    'READY',
    p.`createdAt`,
    p.`updatedAt`
FROM `Project` p
WHERE p.`sourceAssetId` IS NULL
  AND p.`sourceImageUrl` IS NOT NULL
  AND p.`sourceImageUrl` <> ''
  AND NOT EXISTS (
      SELECT 1
      FROM `ProductAsset` a
      WHERE a.`userId` = p.`userId`
        AND a.`fileUrl` = p.`sourceImageUrl`
  );

UPDATE `Project` p
JOIN `ProductAsset` a
  ON a.`userId` = p.`userId`
 AND a.`fileUrl` = p.`sourceImageUrl`
SET p.`sourceAssetId` = a.`id`
WHERE p.`sourceAssetId` IS NULL;
