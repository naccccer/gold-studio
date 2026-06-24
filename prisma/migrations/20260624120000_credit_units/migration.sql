-- Store spendable credit balances and ledgers in internal credit units.
-- 100 creditUnits = 1 visible credit.

ALTER TABLE `User`
  ALTER COLUMN `credits` SET DEFAULT 300;

UPDATE `User`
SET
  `credits` = `credits` * 100,
  `reservedCredits` = `reservedCredits` * 100;

UPDATE `BillingPackage`
SET `credits` = `credits` * 100;

UPDATE `UserSubscription`
SET
  `creditsPerPeriod` = `creditsPerPeriod` * 100,
  `creditsUsedThisPeriod` = `creditsUsedThisPeriod` * 100,
  `reservedCredits` = `reservedCredits` * 100;

UPDATE `CreditEvent`
SET
  `delta` = `delta` * 100,
  `balanceBefore` = `balanceBefore` * 100,
  `balanceAfter` = `balanceAfter` * 100;

ALTER TABLE `GenerationCreditReservation`
  ADD COLUMN `creditUnits` INTEGER NOT NULL DEFAULT 300;

UPDATE `GenerationCreditReservation`
SET `creditUnits` = 100;

ALTER TABLE `Referral`
  MODIFY `rewardCredits` INTEGER NOT NULL DEFAULT 500;

UPDATE `Referral`
SET `rewardCredits` = `rewardCredits` * 100;

ALTER TABLE `SalesReferralCode`
  MODIFY `creditAmount` INTEGER NOT NULL DEFAULT 500;

UPDATE `SalesReferralCode`
SET `creditAmount` = `creditAmount` * 100;
