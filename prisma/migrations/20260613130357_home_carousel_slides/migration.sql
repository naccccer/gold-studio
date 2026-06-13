-- AlterTable
ALTER TABLE `BillingPackage` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `PaymentSettings` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `ProviderSettings` MODIFY `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    MODIFY `imageProvider` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `PurchaseRequest` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `UserSubscription` ALTER COLUMN `updatedAt` DROP DEFAULT;
