import Image from "next/image";
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

type AdminReferenceAssetsPageProps = {
  searchParams?: Promise<{ q?: string; status?: string; vision?: string }>;
};

export default async function AdminReferenceAssetsPage({ searchParams }: AdminReferenceAssetsPageProps) {
  const params = await searchParams;
  const q = params?.q?.trim();
  const status = params?.status ?? "READY";
  const vision = params?.vision ?? "";

  const where: Prisma.StyleReferenceAssetWhereInput = {
    ...(status === "ALL" ? {} : { status: status as "READY" | "ARCHIVED" }),
    ...(vision === "analyzed" ? { visionAnalyzedAt: { not: null } } : {}),
    ...(vision === "error" ? { visionError: { not: null } } : {}),
    ...(q
      ? {
          OR: [
            { id: { contains: q } },
            { title: { contains: q } },
            { originalName: { contains: q } },
            { storageKey: { contains: q } },
            { visionSceneDescription: { contains: q } },
            { visionLighting: { contains: q } },
            { visionBackground: { contains: q } },
            { user: { OR: [{ email: { contains: q } }, { phone: { contains: q } }, { name: { contains: q } }] } },
          ],
        }
      : {}),
  };

  const [assets, readyCount, archivedCount, analyzedCount, errorCount] = await Promise.all([
    db.styleReferenceAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 120,
      include: { user: true, _count: { select: { projects: true, batches: true } } },
    }),
    db.styleReferenceAsset.count({ where: { status: "READY" } }),
    db.styleReferenceAsset.count({ where: { status: "ARCHIVED" } }),
    db.styleReferenceAsset.count({ where: { visionAnalyzedAt: { not: null } } }),
    db.styleReferenceAsset.count({ where: { visionError: { not: null } } }),
  ]);

  return (
    <>
      <AdminPageHeader title="رفرنس‌های سبک" description="Sample/style reference assets برای انتقال نور، زاویه، چیدمان و حال‌وهوای تصویر نمونه." />

      <AdminKpiStrip>
        <AdminKpi label="آماده" value={readyCount} />
        <AdminKpi label="آرشیوشده" value={archivedCount} />
        <AdminKpi label="Vision analyzed" value={analyzedCount} />
        <AdminKpi label="Vision error" value={errorCount} tone={errorCount ? "danger" : "neutral"} />
        <AdminKpi label="نمایش فعلی" value={assets.length} />
      </AdminKpiStrip>

      <AdminFilterBar>
        <form className="grid gap-2 md:grid-cols-[minmax(0,1fr)_150px_160px_auto]">
          <input name="q" defaultValue={q} placeholder="شناسه، مالک، storage key، صحنه، نور یا پس‌زمینه" className={adminInputClass} />
          <select name="status" defaultValue={status} className={adminInputClass}>
            <option value="READY">آماده</option>
            <option value="ARCHIVED">آرشیوشده</option>
            <option value="ALL">همه</option>
          </select>
          <select name="vision" defaultValue={vision} className={adminInputClass}>
            <option value="">همه vision</option>
            <option value="analyzed">تحلیل‌شده</option>
            <option value="error">دارای خطا</option>
          </select>
          <button className={adminPrimaryActionClass}>اعمال</button>
        </form>
      </AdminFilterBar>

      <AdminPanel title="Inventory رفرنس‌ها">
        <AdminDataTable headers={["تصویر", "مالک", "Vision", "استفاده", "Storage", "وضعیت"]} empty={<AdminEmptyState title="رفرنسی با این فیلتر پیدا نشد." />}>
          {assets.map((asset) => (
            <tr key={asset.id} className="hover:bg-slate-50">
              <td className={adminTableCellClass}>
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    <Image src={storageUrlFromKeyOrUrl(asset.storageKey, asset.fileUrl) || uploadPreview.src} alt="" fill unoptimized className="object-cover" sizes="48px" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-950">{asset.title || asset.originalName || "رفرنس بدون نام"}</p>
                    <p className="truncate text-xs text-slate-500">{formatAdminDate(asset.createdAt)}</p>
                  </div>
                </div>
              </td>
              <td className={adminTableCellClass}>
                <a href={`/admin/users/${asset.userId}`} className="font-semibold text-slate-950 hover:underline">{getUserDisplayName(asset.user)}</a>
                <p className="text-xs text-slate-500" dir="ltr">{getUserIdentifier(asset.user)}</p>
              </td>
              <td className={adminTableCellClass}>
                <p className="max-w-[260px] truncate text-sm text-slate-700">{asset.visionSceneDescription || "تحلیل نشده"}</p>
                <p className="max-w-[260px] truncate text-xs text-slate-500">{asset.visionCameraAngle || asset.visionLighting || asset.visionBackground || asset.visionError || "بدون metadata"}</p>
              </td>
              <td className={adminTableCellClass}>{asset._count.projects.toLocaleString("fa-IR")} پروژه · {asset._count.batches.toLocaleString("fa-IR")} batch</td>
              <td className={adminTableCellClass}>
                <p className="max-w-[220px] truncate text-xs text-slate-500" dir="ltr">{asset.storageKey}</p>
                <p className="text-xs text-slate-500">{asset.mimeType}</p>
              </td>
              <td className={adminTableCellClass}><AdminStatus status={asset.status} /></td>
            </tr>
          ))}
        </AdminDataTable>
      </AdminPanel>
    </>
  );
}
