import { visibleCreditsToCreditUnits } from "@/lib/credit-units";

export const INITIAL_SIGNUP_CREDITS = visibleCreditsToCreditUnits(3);
export const FREE_VARIANT_LIMIT = 2;
export const REFERRAL_PURCHASE_REWARD_CREDITS = visibleCreditsToCreditUnits(5);
export const SALES_CODE_BATCH_SIZE = 5;
export const SALES_CODE_CREDITS = visibleCreditsToCreditUnits(5);

export const NO_CREDITS_ERROR =
  "اعتبار کافی برای ساخت خروجی ندارید. از بخش خرید اعتبار یا اشتراک، پلن جدید ثبت کنید.";

export const NO_PROJECT_QUOTA_ERROR =
  "سهمیه پروژه این دوره تمام شده است. برای ساخت پروژه جدید، پلن اختصاصی یا اشتراک تازه ثبت کنید.";
