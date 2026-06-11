import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma";
import {
  adminInputClass,
  adminPrimaryActionClass,
  adminTableCellClass,
  AdminDataTable,
  AdminEmptyState,
  AdminFilterBar,
  AdminKpi,
  AdminKpiStrip,
  AdminPageHeader,
  AdminPanel,
  AdminStatus,
  formatAdminDate,
} from "@/features/admin/components/admin-ui";
import { getUserDisplayName, getUserIdentifier } from "@/lib/auth/user-identity";
import { uploadPreview } from "@/lib/placeholders/jewelry-images";
import { db } from "@/lib/db";
import { storageUrlFromKeyOrUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

type AdminProjectsPageProps = {
  searchParams?: Promise<{ status?: string; q?: string; styleId?: string; archived?: string }>;
};

export default async function AdminProjectsPage({ searchParams }: AdminProjectsPageProps) {
  const params = await searchParams;
  const status = params?.status;
  const q = params?.q?.trim();
  const styleId = params?.styleId;
  const includeArchived = params?.archived === "all";

  const where: Prisma.ProjectWhereInput = {
    ...(includeArchived ? {} : { archivedAt: null }),
    ...(status && status !== "ALL" ? { status: status as "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" } : {}),
    ...(styleId ? { styleId } : {}),
    ...(q
      ? {
          OR: [
            { id: { contains: q } },
            { title: { contains: q } },
            { errorMessage: { contains: q } },
            { prompt: { contains: q } },
            { user: { OR: [{ email: { contains: q } }, { phone: { contains: q } }, { name: { contains: q } }] } },
          ],
        }
      : {}),
  };

  const [projects, styles, counts] = await Promise.all([
    db.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 120,
      include: {
        user: true,
        style: { select: { id: true, name: true } },
        sourceAsset: { select: { storageKey: true } },
        providerEvents: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { supportingAssets: true, providerEvents: true } },
      },
    }),
    db.creativeStyle.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true, name: true } }),
    Promise.all([
      db.project.count({ where: { status: "QUEUED", archivedAt: null } }),
      db.project.count({ where: { status: "PROCESSING", archivedAt: null } }),
      db.project.count({ where: { status: "COMPLETED", archivedAt: null } }),
      db.project.count({ where: { status: "FAILED", archivedAt: null } }),
      db.generationBatch.count({ where: { status: { in: ["QUEUED", "PROCESSING"] } } }),
    ]),
  ]);

  return (
    <>
      <AdminPageHeader
        title="پروژه‌ها و صف تولید"
        description="نمای عملیاتی generation: وضعیت، مالک، سبک، خروجی، خطا و آخرین event provider."
      />

      <AdminKpiStrip>
        <AdminKpi label="در صف" value={counts[0]} tone={counts[0] ? "attention" : "neutral"} />
        <AdminKpi label="در پردازش" value={counts[1]} tone={counts[1] ? "attention" : "neutral"} />
        <AdminKpi label="تکمیل‌شده" value={counts[2]} />
        <AdminKpi label="ناموفق" value={counts[3]} tone={counts[3] ? "danger" : "neutral"} />
        <AdminKpi label="Batch فعال" value={counts[4]} />
        <AdminKpi label="نمایش فعلی" value={projects.length} />
      </AdminKpiStrip>

      <AdminFilterBar>
        <form className="grid gap-2 md:grid-cols-[minmax(0,1fr)_150px_190px_140px_auto]">
          <input name="q" defaultValue={q} placeholder="شناسه، عنوان، خطا، prompt یا کاربر" className={adminInputClass} />
          <select name="status" defaultValue={status ?? "ALL"} className={adminInputClass}>
            <option value="ALL">همه وضعیت‌ها</option>
            <option value="QUEUED">در صف</option>
            <option value="PROCESSING">پردازش</option>
            <option value="COMPLETED">تکمیل‌شده</option>
            <option value="FAILED">ناموفق</option>
          </select>
          <select name="styleId" defaultValue={styleId ?? ""} className={adminInputClass}>
            <option value="">همه سبک‌ها</option>
            {styles.map((style) => (
              <option key={style.id} value={style.id}>{style.name}</option>
            ))}
          </select>
          <select name="archived" defaultValue={includeArchived ? "all" : "active"} className={adminInputClass}>
            <option value="active">فعال</option>
            <option value="all">همراه آرشیو</option>
          </select>
          <button className={adminPrimaryActionClass}>اعمال</button>
        </form>
      </AdminFilterBar>

      <AdminPanel title="لیست پروژه‌ها" description="روی هر پروژه برای باز شدن پرونده کامل کلیک کنید.">
        <AdminDataTable headers={["پروژه", "کاربر", "سبک", "وضعیت", "Provider", "زمان"]} empty={<AdminEmptyState title="پروژه‌ای با این فیلتر پیدا نشد." />}>
          {projects.map((project) => {
            const preview =
              storageUrlFromKeyOrUrl(project.resultStorageKey, project.resultImageUrl) ||
              storageUrlFromKeyOrUrl(project.sourceAsset?.storageKey, project.sourceImageUrl) ||
              uploadPreview.src;
            const lastProviderEvent = project.providerEvents[0];

            return (
              <tr key={project.id} className="hover:bg-slate-50">
                <td className={adminTableCellClass}>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      <Image src={preview} alt="" fill unoptimized className="object-cover" sizes="48px" />
                    </div>
                    <div className="min-w-0">
                      <Link href={`/admin/projects/${project.id}`} className="font-semibold text-slate-950 hover:underline">
                        {project.title || "پروژه بدون عنوان"}
                      </Link>
                      <p className="truncate text-xs text-slate-500" dir="ltr">{project.id}</p>
                      {project.errorMessage ? <p className="max-w-xs truncate text-xs text-rose-700">{project.errorMessage}</p> : null}
                    </div>
                  </div>
                </td>
                <td className={adminTableCellClass}>
                  <Link href={`/admin/users/${project.userId}`} className="font-semibold text-slate-950 hover:underline">{getUserDisplayName(project.user)}</Link>
                  <p className="text-xs text-slate-500" dir="ltr">{getUserIdentifier(project.user)}</p>
                </td>
                <td className={adminTableCellClass}>
                  <p className="font-semibold text-slate-950">{project.style.name}</p>
                  <p className="text-xs text-slate-500">{project.outputPreset} · {project._count.supportingAssets.toLocaleString("fa-IR")} عکس کمکی</p>
                </td>
                <td className={adminTableCellClass}><AdminStatus status={project.status} /></td>
                <td className={adminTableCellClass}>
                  {lastProviderEvent ? (
                    <>
                      <AdminStatus status={lastProviderEvent.status} />
                      <p className="mt-1 text-xs text-slate-500" dir="ltr">{lastProviderEvent.provider}/{lastProviderEvent.model || "unknown"}</p>
                    </>
                  ) : (
                    <span className="text-xs text-slate-500">event ندارد</span>
                  )}
                  <p className="text-xs text-slate-500">{project._count.providerEvents.toLocaleString("fa-IR")} event</p>
                </td>
                <td className={adminTableCellClass}>
                  <p>{formatAdminDate(project.createdAt)}</p>
                  <p className="text-xs text-slate-500">آپدیت {formatAdminDate(project.updatedAt)}</p>
                </td>
              </tr>
            );
          })}
        </AdminDataTable>
      </AdminPanel>
    </>
  );
}
