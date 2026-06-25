import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma";
import {
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
import { getUserDisplayName, getUserIdentifier } from "@/lib/auth/user-identity";
import { uploadPreview } from "@/lib/placeholders/jewelry-images";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/session";
import { storageUrlFromKeyOrUrl } from "@/lib/storage";
import { getVerticalLabel, normalizeVerticalId, USER_VISIBLE_VERTICAL_IDS, VERTICALS } from "@/lib/verticals";

export const dynamic = "force-dynamic";

type AdminReferenceAssetsPageProps = {
  searchParams?: Promise<{ q?: string; status?: string; vision?: string; asset?: string; vertical?: string }>;
};

export default async function AdminReferenceAssetsPage({ searchParams }: AdminReferenceAssetsPageProps) {
  await requireAdminSession();

  const params = await searchParams;
  const q = params?.q?.trim();
  const status = params?.status ?? "READY";
  const vision = params?.vision ?? "";
  const vertical = params?.vertical && params.vertical !== "ALL" ? normalizeVerticalId(params.vertical) : "ALL";
  const verticalWhere: Prisma.StyleReferenceAssetWhereInput = vertical === "ALL" ? {} : { vertical };

  const where: Prisma.StyleReferenceAssetWhereInput = {
    ...(status === "ALL" ? {} : { status: status as "READY" | "ARCHIVED" }),
    ...verticalWhere,
    ...(vision === "analyzed" ? { visionAnalyzedAt: { not: null } } : {}),
    ...(vision === "error" ? { visionError: { not: null } } : {}),
    ...(q
      ? {
          OR: [
            { id: { contains: q } },
            { title: { contains: q } },
            { originalName: { contains: q } },
            { storageKey: { contains: q } },
            { vertical: { contains: q } },
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
    db.styleReferenceAsset.count({ where: { ...verticalWhere, status: "READY" } }),
    db.styleReferenceAsset.count({ where: { ...verticalWhere, status: "ARCHIVED" } }),
    db.styleReferenceAsset.count({ where: { ...verticalWhere, visionError: { not: null } } }),
  ]);

  const selected = assets.find((asset) => asset.id === params?.asset) ?? assets[0] ?? null;

  const baseQuery = (next: { status?: string; vision?: string }) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (vertical !== "ALL") query.set("vertical", vertical);
    query.set("status", next.status ?? status);
    const nextVision = next.vision !== undefined ? next.vision : vision;
    if (nextVision) query.set("vision", nextVision);
    return query;
  };

  const filterHref = (next: { status?: string; vision?: string }) => `/admin/assets/references?${baseQuery(next).toString()}`;
  const assetHref = (assetId: string) => {
    const query = baseQuery({});
    query.set("asset", assetId);
    return `/admin/assets/references?${query.toString()}`;
  };

  return (
    <>
      <ConsoleHeader title="عکس‌های نمونه کاربران" />

      <TabNav
        tabs={[
          { href: `/admin/assets${vertical === "ALL" ? "" : `?vertical=${vertical}`}`, label: "تصاویر منبع کاربران", active: false },
          { href: "/admin/assets/references", label: "عکس‌های نمونه کاربران", active: true },
          { href: `/admin/assets/samples?vertical=${vertical === "food" ? "food" : "jewelry"}`, label: "نمونه‌های آماده", active: false },
          { href: `/admin/assets/outputs${vertical === "ALL" ? "" : `?vertical=${vertical}`}`, label: "خروجی‌ها", active: false },
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
          <select name="vertical" defaultValue={vertical} className={`${inlineFieldClass} w-36`}>
            <option value="ALL">All verticals</option>
            {USER_VISIBLE_VERTICAL_IDS.map((item) => (
              <option key={item} value={item}>
                {VERTICALS[item].label}
              </option>
            ))}
          </select>
          <input name="q" defaultValue={q} placeholder="جست‌وجو" className={`${inlineFieldClass} w-64`} />
          <button className={`${btnSecondary} h-8`}>جست‌وجو</button>
        </form>
      </div>

      {assets.length === 0 ? (
        <Surface className="p-8">
          <EmptyState title="عکس نمونه‌ای با این فیلتر پیدا نشد." />
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
                    aria-label={asset.title || asset.originalName || "عکس نمونه بدون نام"}
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

          {selected ? <ReferenceDetailPanel key={selected.id} asset={selected} /> : null}
        </div>
      )}
    </>
  );
}

type ReferenceWithRelations = Prisma.StyleReferenceAssetGetPayload<{
  include: { user: true; _count: { select: { projects: true; batches: true } } };
}>;

function ReferenceDetailPanel({ asset }: { asset: ReferenceWithRelations }) {
  return (
    <Surface className="lg:sticky lg:top-16">
      <div className="relative aspect-square bg-slate-100">
        <Image
          src={storageUrlFromKeyOrUrl(asset.storageKey, asset.fileUrl) || uploadPreview.src}
          alt={asset.title || asset.originalName || "عکس نمونه بدون نام"}
          fill
          unoptimized
          className="object-cover"
          sizes="300px"
        />
      </div>
      <div className="space-y-4 p-4">
        <div>
          <h2 className="truncate text-sm font-semibold text-navy-950">{asset.title || asset.originalName || "عکس نمونه بدون نام"}</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            <StatusDot status={asset.status} />
          </p>
        </div>

        {asset.visionError ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs leading-6 text-rose-700">{asset.visionError}</p>
        ) : asset.visionSceneDescription ? (
          <p className="rounded-lg bg-navy-25 px-3 py-2 text-xs leading-6 text-slate-600">{asset.visionSceneDescription}</p>
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
            { label: "Vertical", value: getVerticalLabel(asset.vertical) },
            {
              label: "استفاده",
              value:
                asset._count.projects + asset._count.batches > 0
                  ? `${faNum(asset._count.projects)} پروژه · ${faNum(asset._count.batches)} batch`
                  : "استفاده نشده",
            },
            ...(asset.visionLighting ? [{ label: "نور", value: asset.visionLighting }] : []),
            ...(asset.visionCameraAngle ? [{ label: "زاویه دوربین", value: asset.visionCameraAngle }] : []),
            ...(asset.visionBackground ? [{ label: "پس‌زمینه", value: asset.visionBackground }] : []),
            { label: "آپلود", value: formatAdminFullDate(asset.createdAt) },
            { label: "فرمت", value: asset.mimeType, dir: "ltr" as const },
          ]}
        />

        <p className="truncate rounded-lg bg-slate-50 px-2.5 py-1.5 font-mono text-[11px] text-slate-400" dir="ltr" title={asset.storageKey}>
          {asset.storageKey}
        </p>
      </div>
    </Surface>
  );
}
