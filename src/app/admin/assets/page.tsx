import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma";
import { Archive } from "vuesax-icons-react";
import {
  btnDanger,
  btnSecondary,
  ConsoleHeader,
  EmptyState,
  faNum,
  inlineFieldClass,
  formatAdminFullDate,
  KeyValueList,
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
  searchParams?: Promise<{ q?: string; status?: string; vision?: string; asset?: string }>;
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

  const selected = assets.find((asset) => asset.id === params?.asset) ?? assets[0] ?? null;

  const baseQuery = (next: { status?: string; vision?: string }) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    query.set("status", next.status ?? status);
    const nextVision = next.vision !== undefined ? next.vision : vision;
    if (nextVision) query.set("vision", nextVision);
    return query;
  };

  const filterHref = (next: { status?: string; vision?: string }) => `/admin/assets?${baseQuery(next).toString()}`;
  const assetHref = (assetId: string) => {
    const query = baseQuery({});
    query.set("asset", assetId);
    return `/admin/assets?${query.toString()}`;
  };

  return (
    <>
      <ConsoleHeader title="تصاویر" />

      <TabNav
        tabs={[
          { href: "/admin/assets", label: "تصاویر منبع کاربران", active: true },
          { href: "/admin/assets/references", label: "عکس‌های نمونه کاربران", active: false },
          { href: "/admin/assets/samples", label: "نمونه‌های آماده", active: false },
          { href: "/admin/assets/outputs", label: "خروجی‌ها", active: false },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedLinks
          items={[
            { href: filterHref({ status: "READY", vision: "" }), label: "آماده", active: status === "READY" && vision !== "error", count: readyCount },
            { href: filterHref({ status: "ARCHIVED", vision: "" }), label: "آرشیوشده", active: status === "ARCHIVED", count: archivedCount },
            { href: filterHref({ status: "ALL", vision: "error" }), label: "خطای Vision", active: vision === "error", count: errorCount },
            { href: filterHref({ status: "ALL", vision: "" }), label: "همه", active: status === "ALL" && vision !== "error" },
          ]}
        />
        <form className="flex items-center gap-2">
          <input type="hidden" name="status" value={status} />
          {vision ? <input type="hidden" name="vision" value={vision} /> : null}
          <input name="q" defaultValue={q} placeholder="جست‌وجو" className={`${inlineFieldClass} w-64`} />
          <button className={`${btnSecondary} h-8`}>جست‌وجو</button>
        </form>
      </div>

      {assets.length === 0 ? (
        <Surface className="p-8">
          <EmptyState title="تصویری با این فیلتر پیدا نشد." />
        </Surface>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(108px,1fr))] gap-2 p-0">
            {assets.map((asset) => {
              const isSelected = selected?.id === asset.id;
              return (
                <li key={asset.id} className="relative">
                  <Link
                    href={assetHref(asset.id)}
                    aria-current={isSelected ? "true" : undefined}
                    aria-label={asset.title || asset.originalName || "تصویر بدون نام"}
                    className={[
                      "relative block aspect-square overflow-hidden rounded-xl bg-slate-100 transition",
                      isSelected ? "ring-2 ring-navy-700 ring-offset-2 ring-offset-navy-25" : "hover:opacity-85",
                      asset.status === "ARCHIVED" ? "opacity-55" : "",
                    ].join(" ")}
                  >
                    <Image
                      src={storageUrlFromKeyOrUrl(asset.storageKey, asset.fileUrl) || uploadPreview.src}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="140px"
                    />
                    {asset.visionError ? (
                      <span aria-hidden="true" className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>

          {selected ? <AssetDetailPanel key={selected.id} asset={selected} /> : null}
        </div>
      )}
    </>
  );
}

type AssetWithRelations = Prisma.ProductAssetGetPayload<{
  include: {
    user: true;
    _count: { select: { projects: true; supportingProjects: true; batchItems: true } };
  };
}>;

function AssetDetailPanel({ asset }: { asset: AssetWithRelations }) {
  const usedTotal = asset._count.projects + asset._count.supportingProjects;

  return (
    <Surface className="lg:sticky lg:top-16">
      <div className="relative aspect-square bg-slate-100">
        <Image
          src={storageUrlFromKeyOrUrl(asset.storageKey, asset.fileUrl) || uploadPreview.src}
          alt={asset.title || asset.originalName || "تصویر بدون نام"}
          fill
          unoptimized
          className="object-cover"
          sizes="300px"
        />
      </div>
      <div className="space-y-4 p-4">
        <div>
          <h2 className="truncate text-sm font-semibold text-navy-950">
            {asset.title || asset.originalName || asset.visionShortTitle || "تصویر بدون نام"}
          </h2>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <StatusDot status={asset.status} />
            <span>{asset.productType || "بدون نوع محصول"}</span>
          </p>
        </div>

        {asset.visionError ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs leading-6 text-rose-700">{asset.visionError}</p>
        ) : asset.visionDescription || asset.visionShortTitle ? (
          <p className="rounded-lg bg-navy-25 px-3 py-2 text-xs leading-6 text-slate-600">
            {asset.visionDescription || asset.visionShortTitle}
          </p>
        ) : (
          <p className="text-xs text-slate-400">بدون تحلیل Vision</p>
        )}

        <KeyValueList
          items={[
            {
              label: "مالک",
              value: (
                <Link href={`/admin/users/${asset.userId}`} className="hover:text-navy-700 hover:underline">
                  {getUserDisplayName(asset.user)}
                </Link>
              ),
            },
            { label: "شناسه مالک", value: getUserIdentifier(asset.user), dir: "ltr" },
            {
              label: "استفاده",
              value: usedTotal > 0 ? `${faNum(asset._count.projects)} پروژه · ${faNum(asset._count.supportingProjects)} کمکی` : "استفاده نشده",
            },
            ...(asset._count.batchItems > 0 ? [{ label: "Batch", value: faNum(asset._count.batchItems) }] : []),
            { label: "آپلود", value: formatAdminFullDate(asset.createdAt) },
            { label: "فرمت", value: asset.mimeType, dir: "ltr" as const },
            ...(asset.visionModel ? [{ label: "مدل Vision", value: asset.visionModel, dir: "ltr" as const }] : []),
          ]}
        />

        <p className="truncate rounded-lg bg-slate-50 px-2.5 py-1.5 font-mono text-[11px] text-slate-400" dir="ltr" title={asset.storageKey}>
          {asset.storageKey}
        </p>

        {asset.status === "READY" ? (
          <form action={archiveAdminAssetAction} className="border-t border-slate-100 pt-3">
            <input type="hidden" name="assetId" value={asset.id} />
            <button className={btnDanger}>
              <Archive className="h-4 w-4" />
              آرشیو این تصویر
            </button>
          </form>
        ) : null}
      </div>
    </Surface>
  );
}
