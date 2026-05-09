import { Button } from "@/components/ui/button";
import { updateOutputSettingsAction } from "@/features/account/actions";
import { AccountSubpage, accountCardClass, accountInputClass } from "@/features/account/components/account-subpage";
import { requireUserSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function OutputSettingsPage() {
  const session = await requireUserSession();
  const settings = await db.userOutputSettings.findUnique({ where: { userId: session.userId } });

  return (
    <AccountSubpage title="تنظیمات خروجی" caption="پیش‌فرض‌های ساخت تصویر را برای پروژه‌های بعدی تنظیم کنید.">
      <form action={updateOutputSettingsAction} className={`${accountCardClass} space-y-3`}>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">سایز پیش‌فرض</span>
          <select name="defaultOutputPreset" defaultValue={settings?.defaultOutputPreset ?? "post"} className={accountInputClass}>
            <option value="post">پست ۱:۱</option>
            <option value="story">استوری ۹:۱۶</option>
            <option value="banner">بنر ۱۶:۹</option>
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">کیفیت ترجیحی</span>
          <select name="preferredQuality" defaultValue={settings?.preferredQuality ?? "2K"} className={accountInputClass}>
            <option value="1K">1K</option>
            <option value="2K">2K</option>
            <option value="4K">4K</option>
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">نام‌گذاری فایل</span>
          <select name="fileNamingMode" defaultValue={settings?.fileNamingMode ?? "project-date"} className={accountInputClass}>
            <option value="project-date">نام پروژه + تاریخ</option>
            <option value="original-name">نام فایل اصلی</option>
            <option value="style-date">سبک + تاریخ</option>
          </select>
        </label>
        <label className="flex min-h-11 items-center gap-2 rounded-[0.95rem] border border-border bg-white px-3 text-xs font-medium text-foreground">
          <input name="autoSaveToProjects" type="checkbox" defaultChecked={settings?.autoSaveToProjects ?? true} className="h-4 w-4 accent-[#9b773f]" />
          ذخیره خودکار خروجی در پروژه‌ها
        </label>
        <Button type="submit" size="full" className="h-11 rounded-[0.95rem]">
          ذخیره تنظیمات
        </Button>
      </form>
    </AccountSubpage>
  );
}
