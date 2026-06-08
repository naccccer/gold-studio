import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountSectionHeader, AccountSubpage, accountCardClass, accountInputClass } from "@/features/account/components/account-subpage";
import { updateOutputSettingsAction } from "@/features/account/actions";
import { requireUserSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function OutputSettingsPage() {
  const session = await requireUserSession();
  const settings = await db.userOutputSettings.findUnique({ where: { userId: session.userId } });

  return (
    <AccountSubpage title="تنظیمات خروجی">
      <form action={updateOutputSettingsAction} className={`${accountCardClass} space-y-3`}>
        <AccountSectionHeader icon={Settings} title="پیش‌فرض‌های ساخت" />
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-ink-3">سایز پیش‌فرض</span>
          <select name="defaultOutputPreset" defaultValue={settings?.defaultOutputPreset ?? "post"} className={accountInputClass}>
            <option value="post">پست ۱:۱</option>
            <option value="story">استوری ۹:۱۶</option>
            <option value="banner">بنر ۱۶:۹</option>
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-ink-3">کیفیت ترجیحی</span>
          <select name="preferredQuality" defaultValue={settings?.preferredQuality ?? "2K"} className={accountInputClass}>
            <option value="1K">1K</option>
            <option value="2K">2K</option>
            <option value="4K">4K</option>
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-ink-3">نام‌گذاری فایل</span>
          <select name="fileNamingMode" defaultValue={settings?.fileNamingMode ?? "project-date"} className={accountInputClass}>
            <option value="project-date">نام پروژه + تاریخ</option>
            <option value="original-name">نام فایل اصلی</option>
            <option value="style-date">سبک + تاریخ</option>
          </select>
        </label>
        <label className="flex min-h-11 items-center gap-2 rounded-[var(--r-md)] border border-border-hairline bg-surface px-3 text-xs font-medium text-ink-1">
          <input name="autoSaveToProjects" type="checkbox" defaultChecked={settings?.autoSaveToProjects ?? true} className="h-4 w-4 accent-champagne-500" />
          ذخیره خودکار خروجی در پروژه‌ها
        </label>
        <Button type="submit" size="full" className="h-11">
          ذخیره تنظیمات
        </Button>
      </form>
    </AccountSubpage>
  );
}
