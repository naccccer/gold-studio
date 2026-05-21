import Link from "next/link";
import { Card, Clock, Danger, ProfileCircle, TickCircle } from "vuesax-icons-react";
import {
  adminDangerActionClass,
  adminPrimaryActionClass,
  AdminMetric,
  AdminRow,
  AdminSection,
  AdminStatus,
  EmptyAdminState,
  formatAdminDate,
  formatIrr,
} from "@/features/admin/components/admin-ui";
import { approvePurchaseRequestAction, rejectPurchaseRequestAction, retryAdminProjectAction } from "@/features/admin/actions";
import { getUserDisplayName, getUserIdentifier } from "@/lib/auth/user-identity";
import { requireAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { storageUrlFromKeyOrUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdminSession();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    usersCount,
    activeSubscriptionsCount,
    pendingPurchasesCount,
    failedProjectsCount,
    activeProjectsCount,
    providerFailuresCount,
    recentFailures,
    recentProjects,
    pendingPurchases,
    usersNeedingAttention,
  ] = await Promise.all([
    db.user.count(),
    db.userSubscription.count({ where: { status: "ACTIVE", currentPeriodEnd: { gt: new Date() } } }),
    db.purchaseRequest.count({ where: { status: "PENDING" } }),
    db.project.count({ where: { status: "FAILED", archivedAt: null } }),
    db.project.count({ where: { status: { in: ["QUEUED", "PROCESSING"] }, archivedAt: null } }),
    db.providerEvent.count({ where: { status: "FAILED", createdAt: { gte: today } } }),
    db.project.findMany({
      where: { status: "FAILED", archivedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: { user: true, style: { select: { name: true } } },
    }),
    db.project.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { user: true, style: { select: { name: true } } },
    }),
    db.purchaseRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 6,
      include: { user: true, package: true },
    }),
    db.user.findMany({
      where: { credits: { lte: 1 } },
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: {
        _count: { select: { projects: true, assets: true } },
        subscriptions: { where: { status: "ACTIVE" }, take: 1, orderBy: { currentPeriodEnd: "desc" } },
      },
    }),
  ]);

  return (
    <>
      <section className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <AdminMetric label="کاربران" value={usersCount} />
        <AdminMetric label="اشتراک فعال" value={activeSubscriptionsCount} />
        <AdminMetric label="درخواست خرید" value={pendingPurchasesCount} />
        <AdminMetric label="پروژه ناموفق" value={failedProjectsCount} />
        <AdminMetric label="صف/پردازش" value={activeProjectsCount} />
        <AdminMetric label="خطای امروز AI" value={providerFailuresCount} />
      </section>

      <div className="grid items-stretch gap-3 xl:grid-cols-2">
        <AdminSection title="شکست‌های اخیر" eyebrow="نیازمند رسیدگی" action={<Danger className="h-4 w-4 text-danger" />}>
          {recentFailures.length === 0 ? (
            <EmptyAdminState>فعلا پروژه ناموفق فعالی وجود ندارد.</EmptyAdminState>
          ) : (
            recentFailures.map((project) => (
              <AdminRow key={project.id}>
                <div className="min-w-0">
                  <Link href={`/admin/projects?projectId=${project.id}`} className="font-semibold text-foreground hover:underline">
                    {project.title || "پروژه بدون عنوان"}
                  </Link>
                  <p className="truncate text-xs text-muted">{project.errorMessage || "خطای ثبت‌شده ندارد"}</p>
                </div>
                <div className="text-xs text-muted">
                  <p>{getUserDisplayName(project.user)}</p>
                  <p>{project.style.name} · {formatAdminDate(project.updatedAt)}</p>
                </div>
                <form action={retryAdminProjectAction}>
                  <input type="hidden" name="projectId" value={project.id} />
                  <button className={adminPrimaryActionClass}>
                    <Clock className="h-3.5 w-3.5" />
                    تلاش دوباره
                  </button>
                </form>
              </AdminRow>
            ))
          )}
        </AdminSection>

        <AdminSection title="درخواست‌های خرید" eyebrow="بسته و اشتراک" action={<Card className="h-4 w-4 text-accent" />}>
          {pendingPurchases.length === 0 ? (
            <EmptyAdminState>درخواست خرید در انتظار تایید نیست.</EmptyAdminState>
          ) : (
            pendingPurchases.map((request) => (
              <AdminRow key={request.id} className="md:grid-cols-[minmax(0,1fr)_auto]">
                <div>
                  <p className="font-semibold text-foreground">{request.package.title}</p>
                  <p className="text-xs text-muted">
                    {getUserDisplayName(request.user)} · {formatIrr(request.amount, request.currency)}
                  </p>
                  {storageUrlFromKeyOrUrl(request.receiptStorageKey, request.receiptImageUrl) ? (
                    <a href={storageUrlFromKeyOrUrl(request.receiptStorageKey, request.receiptImageUrl) ?? ""} target="_blank" rel="noreferrer" className="mt-1 block text-xs font-medium text-accent-deep">
                      مشاهده رسید
                    </a>
                  ) : (
                    <p className="mt-1 text-xs text-danger">رسید ارسال نشده است.</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={approvePurchaseRequestAction}>
                    <input type="hidden" name="requestId" value={request.id} />
                    <button className={adminPrimaryActionClass}>
                      <TickCircle className="h-3.5 w-3.5" />
                      تایید
                    </button>
                  </form>
                  <form action={rejectPurchaseRequestAction}>
                    <input type="hidden" name="requestId" value={request.id} />
                    <button className={adminDangerActionClass}>
                      رد
                    </button>
                  </form>
                </div>
              </AdminRow>
            ))
          )}
        </AdminSection>
      </div>

      <div className="grid items-stretch gap-3 xl:grid-cols-2">
        <AdminSection title="تولیدهای اخیر" eyebrow="جریان خروجی‌ها">
          {recentProjects.map((project) => (
            <AdminRow key={project.id}>
              <div className="min-w-0">
                <Link href={`/admin/projects?projectId=${project.id}`} className="font-semibold text-foreground hover:underline">
                  {project.title || "پروژه بدون عنوان"}
                </Link>
                <p className="text-xs text-muted">{getUserDisplayName(project.user)}</p>
              </div>
              <p className="text-xs text-muted">{project.style.name} · {formatAdminDate(project.createdAt)}</p>
              <AdminStatus status={project.status} />
            </AdminRow>
          ))}
        </AdminSection>

        <AdminSection title="کاربران نیازمند توجه" eyebrow="اعتبار کم یا بدون اشتراک">
          {usersNeedingAttention.length === 0 ? (
            <EmptyAdminState>مورد فوری دیده نمی‌شود.</EmptyAdminState>
          ) : (
            usersNeedingAttention.map((user) => (
              <AdminRow key={user.id}>
                <div>
                  <Link href={`/admin/users?userId=${user.id}`} className="font-semibold text-foreground hover:underline">
                    {getUserDisplayName(user)}
                  </Link>
                  <p className="text-xs text-muted" dir="ltr">{getUserIdentifier(user)}</p>
                </div>
                <p className="text-xs text-muted">
                  {user.credits.toLocaleString("fa-IR")} اعتبار · {user._count.projects.toLocaleString("fa-IR")} پروژه
                </p>
                <ProfileCircle className="h-4 w-4 text-muted" />
              </AdminRow>
            ))
          )}
        </AdminSection>
      </div>
    </>
  );
}
