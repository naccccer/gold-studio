import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma";
import {
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

  const [assets, readyCount, archivedCount, errorCount] = await Promise.all([
    db.styleReferenceAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 120,
      include: { user: true, _count: { select: { projects: true, batches: true } } },
    }),
    db.styleReferenceAsset.count({ where: { status: "READY" } }),
    db.styleReferenceAsset.count({ where: { status: "ARCHIVED" } }),
    db.styleReferenceAsset.count({ where: { visionError: { not: null } } }),
  ]);

  const filterHref = (next: { status?: string; vision?: string }) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    query.set("status", next.status ?? status);
    const nextVision = next.vision !== undefined ? next.vision : vision;
    if (nextVision) query.set("vision", nextVision);
    return `/admin/assets/references?${query.toString()}`;
  };

  return (
    <>
      <ConsoleHeader title="رفرنس‌های سبک" meta={<span>{faNum(readyCount)} رفرنس آماده</span>} />

      <TabNav
        tabs={[
          { href: "/admin/assets", label: "تصاویر منبع کاربران", active: false },
          { href: "/admin/assets/references", label: "رفرنس‌های سبک", active: true },
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
          <input name="q" defaultValue={q} placeholder="شناسه، مالک، صحنه، نور یا پس‌زمینه" className={`${fieldClass} h-8 w-64 text-xs`} />
          <button className={`${btnSecondary} h-8`}>جست‌وجو</button>
        </form>
      </div>

      <Surface>
        <ConsoleTable
          head={["تصویر", "مالک", "Vision", "استفاده", "وضعیت"]}
          empty={<EmptyState title="رفرنسی با این فیلتر پیدا نشد." />}
        >
          {assets.map((asset) => (
            <tr key={asset.id}>
              <td className={cellClass}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    <Image src={storageUrlFromKeyOrUrl(asset.storageKey, asset.fileUrl) || uploadPreview.src} alt="" fill unoptimized className="object-cover" sizes="40px" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{asset.title || asset.originalName || "رفرنس بدون نام"}</span>
                    <span className="block truncate text-xs text-slate-400">{formatAdminDate(asset.createdAt)}</span>
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
                <p className="max-w-64 truncate text-xs text-slate-500">{asset.visionSceneDescription || "تحلیل نشده"}</p>
                <p className="max-w-64 truncate text-xs text-slate-400">
                  {asset.visionCameraAngle || asset.visionLighting || asset.visionBackground || asset.visionError || "بدون metadata"}
                </p>
              </td>
              <td className={`${cellClass} text-xs text-slate-500`}>
                {faNum(asset._count.projects)} پروژه · {faNum(asset._count.batches)} batch
              </td>
              <td className={cellClass}>
                <StatusDot status={asset.status} />
              </td>
            </tr>
          ))}
        </ConsoleTable>
      </Surface>
    </>
  );
}
