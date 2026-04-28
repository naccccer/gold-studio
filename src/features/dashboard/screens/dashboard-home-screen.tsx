import { ButtonLink } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
import { Surface } from "@/components/ui/surface";

type DashboardHomeScreenProps = {
  userName?: string | null;
  projectCount: number;
  completedCount: number;
};

export function DashboardHomeScreen({
  userName,
  projectCount,
  completedCount,
}: DashboardHomeScreenProps) {
  return (
    <PageShell>
      <Surface padding="lg">
        <h2 className="text-lg font-semibold text-slate-900">سلام {userName || "دوست عزیز"} 👋</h2>
        <p className="mt-2 text-sm text-slate-600">از اینجا می‌توانید پروژه جدید بسازید و خروجی‌ها را دانلود کنید.</p>
      </Surface>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Surface radius="md">
          <p className="text-xs text-slate-500">اعتبار باقی‌مانده</p>
          <p className="mt-2 text-xl font-semibold">نامحدود</p>
        </Surface>
        <Surface radius="md">
          <p className="text-xs text-slate-500">کل پروژه‌ها</p>
          <p className="mt-2 text-xl font-semibold">{projectCount}</p>
        </Surface>
        <Surface radius="md" className="col-span-2 sm:col-span-1">
          <p className="text-xs text-slate-500">خروجی آماده</p>
          <p className="mt-2 text-xl font-semibold">{completedCount}</p>
        </Surface>
      </div>

      <ButtonLink href="/projects/new">پروژه جدید</ButtonLink>
    </PageShell>
  );
}
