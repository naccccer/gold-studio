import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma";
import { Archive } from "vuesax-icons-react";
import {
  btnDanger,
  btnSecondary,
  cellClass,
  ConsoleHeader,
  ConsoleTable,
  EmptyState,
  faNum,
  fieldClass,
  formatAdminDate,
  SegmentedLinks,
  StatusDot,
  Surface,
  TabNav,
} from "@/features/admin/components/console";
import { archiveAdminAssetAction } from "@/features/admin/actions";
import { getUserDisplayName, getUserIdentifier } from "@/lib/auth/user-identity";
import { uploadPreview } from "@/lib/placeholders/jewelry-images";
import { db } from "@/lib/db";
import { storageUrlFromKeyOrUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

type AdminAssetsPageProps = {
  searchParams?: Promise<{ q?: string; status?: string; vision?: string }>;
};

export default async function AdminAssetsPage({ searchParams }: AdminAssetsPageProps) {
  const params = await searchParams;
  const q = params?.q?.trim();
  const status = params?.status ?? "READY";
  const vision = params?.vision ?? "";

  const where: Prisma.ProductAssetWhereInput = {
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
            { productType: { contains: q } },
            { visionShortTitle: { contains: q } },
            { visionDescription: { contains: q } },
            { user: { OR: [{ email: { contains: q } }, { phone: { contains: q } }, { name: { contains: q } }] } },
          ],
        }
      : {}),
  };

  const [assets, readyCount, archivedCount, errorCount] = await Promise.all([
    db.productAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 120,
      include: {
        user: true,
        _count: { select: { projects: true, supportingProjects: true, batchItems: true } },
      },
    }),
    db.productAsset.count({ where: { status: "READY" } }),
    db.productAsset.count({ where: { status: "ARCHIVED" } }),
    db.productAsset.count({ where: { visionError: { not: null } } }),
  ]);

  const filterHref = (next: { status?: string; vision?: string }) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    query.set("status", next.status ?? status);
    if (next.vision !== undefined ? next.vision : vision) query.set("vision", next.vision !== undefined ? next.vision : vision);
    return `/admin/assets?${query.toString()}`;
  };

  return (
    <>
      <ConsoleHeader title="دارایی‌ها" meta={<span>{faNum(readyCount)} تصویر منبع آماده</span>} />

      <TabNav
        tabs={[
          { href: "/admin/assets", label: "تصاویر منبع کاربران", active: true },
          { href: "/admin/assets/references", label: "رفرنس‌های سبک", active: false },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedLinks
          items={[
            { href: filterHref({ status: "READY" }), label: "آماده", active: status === "READY", count: readyCount },
            { href: filterHref({ status: "ARCHIVED" }), label: "آرشیوشده", active: status === "ARCHIVED", count: archivedCount },
            { href: filterHref({ status: "ALL", vision: "error" }), label: "خطای Vision", active: vision === "error", count: errorCount },
            { href: filterHref({ status: "ALL", vision: "" }), label: "همه", active: status === "ALL" && vision !== "error" },
          ]}
        />
        <form className="flex items-center gap-2">
          <input type="hidden" name="status" value={status} />
          {vision ? <input type="hidden" name="vision" value={vision} /> : null}
          <input name="q" defaultValue={q} placeholder="شناسه، مالک، نوع محصول یا vision" className={`${fieldClass} h-8 w-64 text-xs`} />
          <button className={`${btnSecondary} h-8`}>جست‌وجو</button>
        </form>
      </div>

      <Surface>
        <ConsoleTable
          head={["تصویر", "مالک", "Vision", "استفاده", "وضعیت", ""]}
          empty={<EmptyState title="دارایی‌ای با این فیلتر پیدا نشد." />}
        >
          {assets.map((asset) => (
            <tr key={asset.id}>
              <td className={cellClass}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    <Image src={storageUrlFromKeyOrUrl(asset.storageKey, asset.fileUrl) || uploadPreview.src} alt="" fill unoptimized className="object-cover" sizes="40px" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{asset.title || asset.originalName || asset.visionShortTitle || "تصویر بدون نام"}</span>
                    <span className="block truncate text-xs text-slate-400">
                      {asset.productType || "بدون نوع محصول"} · {formatAdminDate(asset.createdAt)}
                    </span>
                  </span>
                </div>
              </td>
              <td className={cellClass}>
                <Link href={`/admin/users/${asset.userId}`} className="font-medium hover:text-navy-700 hover:underline">
                  {getUserDisplayName(asset.user)}
                </Link>
                <p className="text-xs text-slate-400" dir="ltr">
                  {getUserIdentifier(asset.user)}
                </p>
              </td>
              <td className={cellClass}>
                <p className="max-w-56 truncate text-xs text-slate-500">{asset.visionDescription || asset.visionShortTitle || "تحلیل نشده"}</p>
                {asset.visionError ? <p className="max-w-56 truncate text-xs text-rose-600">{asset.visionError}</p> : null}
              </td>
              <td className={`${cellClass} text-xs text-slate-500`}>
                {faNum(asset._count.projects)} پروژه · {faNum(asset._count.supportingProjects)} کمکی · {faNum(asset._count.batchItems)} batch
              </td>
              <td className={cellClass}>
                <StatusDot status={asset.status} />
              </td>
              <td className={cellClass}>
                {asset.status === "READY" ? (
                  <form action={archiveAdminAssetAction} className="flex justify-end">
                    <input type="hidden" name="assetId" value={asset.id} />
                    <button className={btnDanger}>
                      <Archive className="h-4 w-4" />
                      آرشیو
                    </button>
                  </form>
                ) : null}
              </td>
            </tr>
          ))}
        </ConsoleTable>
      </Surface>
    </>
  );
}
