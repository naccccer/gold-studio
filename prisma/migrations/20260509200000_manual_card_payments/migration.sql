ALTER TABLE `PurchaseRequest`
  ADD COLUMN `receiptImageUrl` VARCHAR(191) NULL,
  ADD COLUMN `receiptStorageKey` VARCHAR(191) NULL,
  ADD COLUMN `receiptNote` TEXT NULL,
  ADD COLUMN `receiptSubmittedAt` DATETIME(3) NULL;

CREATE TABLE `PaymentSettings` (
  `id` VARCHAR(191) NOT NULL DEFAULT 'default',
  `cardholderName` VARCHAR(191) NOT NULL,
  `cardNumber` VARCHAR(191) NOT NULL,
  `instructions` TEXT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `PaymentSettings` (`id`, `cardholderName`, `cardNumber`, `instructions`, `isActive`, `updatedAt`)
VALUES ('default', 'نام صاحب کارت', '0000-0000-0000-0000', 'بعد از واریز کارت‌به‌کارت، تصویر رسید را از بخش حساب ارسال کنید.', true, NOW(3))
ON DUPLICATE KEY UPDATE
  `updatedAt` = NOW(3);

DELETE FROM `BillingPackage`
WHERE `id` IN ('pkg_starter_credits', 'pkg_studio_monthly')
  AND `id` NOT IN (SELECT DISTINCT `packageId` FROM `PurchaseRequest`)
  AND `id` NOT IN (SELECT DISTINCT `packageId` FROM `UserSubscription`);

INSERT INTO `BillingPackage` (`id`, `type`, `title`, `description`, `priceAmount`, `credits`, `periodDays`, `isActive`, `isPublic`, `sortOrder`, `createdAt`, `updatedAt`)
VALUES
  ('pkg_subscription_starter', 'SUBSCRIPTION', 'استارتر', '۲۰ خروجی در ماه برای شروع فروش حرفه‌ای', 59000000, 20, 30, true, true, 10, NOW(3), NOW(3)),
  ('pkg_subscription_studio', 'SUBSCRIPTION', 'استودیو', '۶۰ خروجی در ماه برای فروشگاه فعال', 149000000, 60, 30, true, true, 20, NOW(3), NOW(3)),
  ('pkg_subscription_pro', 'SUBSCRIPTION', 'حرفه‌ای', '۱۵۰ خروجی در ماه برای تیم‌های جدی و تولید پیوسته', 329000000, 150, 30, true, true, 30, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `type` = VALUES(`type`),
  `title` = VALUES(`title`),
  `description` = VALUES(`description`),
  `priceAmount` = VALUES(`priceAmount`),
  `credits` = VALUES(`credits`),
  `periodDays` = VALUES(`periodDays`),
  `isActive` = VALUES(`isActive`),
  `isPublic` = VALUES(`isPublic`),
  `sortOrder` = VALUES(`sortOrder`),
  `updatedAt` = NOW(3);
