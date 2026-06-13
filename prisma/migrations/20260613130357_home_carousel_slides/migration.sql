-- AlterTable
ALTER TABLE `billingpackage` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `paymentsettings` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `providersettings` MODIFY `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    MODIFY `imageProvider` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `purchaserequest` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `usersubscription` ALTER COLUMN `updatedAt` DROP DEFAULT;
