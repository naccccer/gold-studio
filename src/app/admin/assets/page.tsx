import Image from "next/image";
import Link from "next/link";
import { Archive } from "lucide-react";
import { AdminMetric, AdminRow, AdminSection, EmptyAdminState, formatAdminDate } from "@/features/admin/components/admin-ui";
import { archiveAdminAssetAction } from "@/features/admin/actions";
import { getUserDisplayName, getUserIdentifier } from "@/lib/auth/user-identity";
import { uploadPreview } from "@/lib/placeholders/jewelry-images";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type AdminAssetsPageProps = {
  searchParams?: Promise<{ q?: string; status?: string }>;
};

export default async function AdminAssetsPage({ searchParams }: AdminAssetsPageProps) {
  const params = await searchParams;
  const q = params?.q?.trim();
  const status = params?.status ?? "READY";
  const where = {
    ...(status === "ALL" ? {} : { status: status as "READY" | "ARCHIVED" }),
    ...(q
      ? {
          OR: [
            { id: { contains: q } },
            { title: { contains: q } },
            { originalName: { contains: q } },
            { storageKey: { contains: q } },
            { user: { OR: [{ email: { contains: q } }, { phone: { contains: q } }, { name: { contains: q } }] } },
          ],
        }
      : {}),
  };

  const [assets, readyCount, archivedCount] = await Promise.all([
    db.productAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 80,
      include: {
        user: true,
        _count: { select: { projects: true } },
      },
    }),
    db.productAsset.count({ where: { status: "READY" } }),
    db.productAsset.count({ where: { status: "ARCHIVED" } }),
  ]);

  return (
    <>
      <section className="grid gap-3 sm:grid-cols-3">
        <AdminMetric label="آماده" value={readyCount} />
        <AdminMetric label="آرشیوشده" value={archivedCount} />
        <AdminMetric label="نمایش فعلی" value={assets.length} />
      </section>

      <AdminSection title="فیلتر دارایی‌ها" eyebrow="تصاویر منبع گالری">
        <form className="grid gap-2 md:grid-cols-[1fr_160px_auto]">
          <input name="q" defaultValue={q} placeholder="شناسه، مالک، نام یا storage key" className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-sm outline-none" />
          <select name="status" defaultValue={status} className="h-10 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-sm outline-none">
            <option value="READY">آماده</option>
            <option value="ARCHIVED">آرشیوشده</option>
            <option value="ALL">همه</option>
          </select>
          <button className="h-10 rounded-[var(--radius-sm)] bg-foreground px-4 text-sm text-surface">اعمال</button>
        </form>
      </AdminSection>

      <AdminSection title="دارایی‌های گالری" eyebrow="مالکیت، ذخیره‌سازی و استفاده">
        {assets.length === 0 ? (
          <EmptyAdminState>دارایی‌ای با این فیلتر پیدا نشد.</EmptyAdminState>
        ) : (
          assets.map((asset) => (
            <AdminRow key={asset.id}>
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-surface-soft">
                  <Image src={asset.fileUrl || uploadPreview.src} alt="" fill className="object-cover" sizes="56px" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{asset.title || asset.originalName || "تصویر بدون نام"}</p>
                  <p className="truncate text-xs text-muted" dir="ltr">{asset.storageKey}</p>
                </div>
              </div>
              <div className="text-xs text-muted">
                <Link href={`/admin/users?userId=${asset.userId}`} className="font-medium text-foreground hover:underline">
                  {getUserDisplayName(asset.user)}
                </Link>
                <p dir="ltr">{getUserIdentifier(asset.user)}</p>
                <p>{asset.mimeType} · {asset._count.projects.toLocaleString("fa-IR")} پروژه · {formatAdminDate(asset.createdAt)}</p>
              </div>
              {asset.status === "READY" ? (
                <form action={archiveAdminAssetAction}>
                  <input type="hidden" name="assetId" value={asset.id} />
                  <button className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-danger/30 bg-danger-soft px-3 text-xs text-danger">
                    <Archive className="h-3.5 w-3.5" />
                    آرشیو
                  </button>
                </form>
              ) : (
                <span className="text-xs text-muted">آرشیوشده</span>
              )}
            </AdminRow>
          ))
        )}
      </AdminSection>
    </>
  );
}
