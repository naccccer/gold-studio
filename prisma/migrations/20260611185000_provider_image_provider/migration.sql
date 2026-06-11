SET @provider_settings_image_provider_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ProviderSettings'
    AND COLUMN_NAME = 'imageProvider'
);

SET @provider_settings_image_provider_sql = IF(
  @provider_settings_image_provider_exists = 0,
  'ALTER TABLE `ProviderSettings` ADD COLUMN `imageProvider` VARCHAR(32) NULL AFTER `id`',
  'SELECT 1'
);

PREPARE provider_settings_image_provider_stmt FROM @provider_settings_image_provider_sql;
EXECUTE provider_settings_image_provider_stmt;
DEALLOCATE PREPARE provider_settings_image_provider_stmt;
