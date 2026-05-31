-- AlterTable
ALTER TABLE `billingpackage` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `paymentsettings` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `purchaserequest` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `usersubscription` ALTER COLUMN `updatedAt` DROP DEFAULT;
