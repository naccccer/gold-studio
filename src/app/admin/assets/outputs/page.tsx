import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma";
import {
  btnSecondary,
  AdminPagination,
  ConsoleHeader,
  EmptyState,
  faNum,
  inlineFieldClass,
  formatAdminFullDate,
  KeyValueList,
  StatusDot,
  Surface,
  TabNav,
} from "@/features/admin/components/console";
import { AdminImagePreview } from "@/features/admin/components/admin-image-preview";
import { getUserDisplayName, getUserIdentifier } from "@/lib/auth/user-identity";
import { formatInternalCreditUnits, getGenerationCreditUnitCost } from "@/lib/credit-units";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/session";
import { storageThumbnailUrlFromKeyOrUrl, storageUrlFromKeyOrUrl } from "@/lib/storage";
import { getVerticalLabel, normalizeVerticalId, USER_VISIBLE_VERTICAL_IDS, VERTICALS } from "@/lib/verticals";

export const dynamic = "force-dynamic";

type AdminOutputsPageProps = {
  searchParams?: Promise<{ q?: string; project?: string; vertical?: string; page?: string }>;
};

const PAGE_SIZE = 36;

export default async function AdminOutputsPage({ searchParams }: AdminOutputsPageProps) {
  await requireAdminSession();

  const params = await searchParams;
  const q = params?.q?.trim();
  const vertical = params?.vertical && params.vertical !== "ALL" ? normalizeVerticalId(params.vertical) : "ALL";
  const requestedPage = Number.parseInt(params?.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const where: Prisma.ProjectWhereInput = {
    status: "COMPLETED",
    archivedAt: null,
    ...(vertical === "ALL" ? {} : { vertical }),
    OR: [{ resultStorageKey: { not: null } }, { resultImageUrl: { not: null } }],
    ...(q
      ? {
          AND: [
            {
              OR: [
                { id: { contains: q } },
                { title: { contains: q } },
                { vertical: { contains: q } },
                { style: { name: { contains: q } } },
                { user: { OR: [{ email: { contains: q } }, { phone: { contains: q } }, { name: { contains: q } }] } },
              ],
            },
          ],
        }
      : {}),
  };

  const [projects, totalOutputs] = await Promise.all([
    db.project.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: true,
        style: { select: { name: true } },
        sourceAsset: { select: { storageKey: true } },
        creditReservations: { orderBy: { createdAt: "desc" }, take: 1, select: { creditUnits: true } },
      },
    }),
    db.project.count({
      where,
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalOutputs / PAGE_SIZE));
  if (page > totalPages) {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (vertical !== "ALL") query.set("vertical", vertical);
    if (totalPages > 1) query.set("page", String(totalPages));
    const value = query.toString();
    redirect(`/admin/assets/outputs${value ? `?${value}` : ""}`);
  }

  const withUrls = projects
    .map((project) => ({
      project,
      resultUrl: storageUrlFromKeyOrUrl(project.resultStorageKey, project.resultImageUrl),
      sourceUrl: storageUrlFromKeyOrUrl(project.sourceAsset?.storageKey, project.sourceImageUrl),
      resultThumbnailUrl: storageThumbnailUrlFromKeyOrUrl(project.resultStorageKey, project.resultImageUrl, "card"),
      sourceThumbnailUrl: storageThumbnailUrlFromKeyOrUrl(project.sourceAsset?.storageKey, project.sourceImageUrl, "tiny"),
    }))
    .filter((item): item is typeof item & { resultUrl: string } => Boolean(item.resultUrl));

  const selected = withUrls.find((item) => item.project.id === params?.project) ?? withUrls[0] ?? null;

  const projectHref = (projectId: string) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (vertical !== "ALL") query.set("vertical", vertical);
    if (page > 1) query.set("page", String(page));
    query.set("project", projectId);
    return `/admin/assets/outputs?${query.toString()}`;
  };

  return (
    <>
      <ConsoleHeader
        title="خروجی‌های تولیدشده"
        meta={<span>{faNum(totalOutputs)} خروجی موفق</span>}
      />

      <TabNav
        tabs={[
          { href: `/admin/assets${vertical === "ALL" ? "" : `?vertical=${vertical}`}`, label: "تصاویر منبع کاربران", active: false },
          { href: `/admin/assets/references${vertical === "ALL" ? "" : `?vertical=${vertical}`}`, label: "عکس‌های نمونه کاربران", active: false },
          { href: `/admin/assets/samples?vertical=${vertical === "food" ? "food" : "jewelry"}`, label: "نمونه‌های آماده", active: false },
          { href: "/admin/assets/outputs", label: "خروجی‌ها", active: true },
        ]}
      />

      <form className="flex items-center gap-2">
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

      {withUrls.length === 0 ? (
        <Surface className="p-8">
          <EmptyState title="خروجی‌ای با این فیلتر پیدا نشد." />
        </Surface>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(108px,1fr))] gap-2 p-0">
            {withUrls.map(({ project, resultUrl, resultThumbnailUrl }) => {
              const isSelected = selected?.project.id === project.id;
              return (
                <li key={project.id} className="relative">
                  <Link
                    href={projectHref(project.id)}
                    aria-current={isSelected ? "true" : undefined}
                    aria-label={project.title || "پروژه بدون عنوان"}
                    className={[
                      "relative block aspect-square overflow-hidden rounded-xl bg-slate-100 transition",
                      isSelected ? "ring-2 ring-navy-700 ring-offset-2 ring-offset-navy-25" : "hover:opacity-85",
                    ].join(" ")}
                  >
                    <Image src={resultThumbnailUrl || resultUrl} alt="" fill unoptimized className="object-cover" sizes="140px" />
                  </Link>
                </li>
              );
            })}
          </ul>

          {selected ? (
            <Surface key={selected.project.id} className="lg:sticky lg:top-16">
              <div className="relative aspect-square bg-slate-100">
                <AdminImagePreview
                  thumbnailSrc={selected.resultThumbnailUrl || selected.resultUrl}
                  originalSrc={selected.resultUrl}
                  alt={selected.project.title || "پروژه بدون عنوان"}
                  sizes="300px"
                  className="absolute inset-0 h-full w-full"
                  detailHref={`/admin/projects/${selected.project.id}`}
                />
                {selected.sourceUrl ? (
                  <span className="absolute bottom-2 right-2 block h-16 w-16 overflow-hidden rounded-lg ring-2 ring-white">
                    <Image src={selected.sourceThumbnailUrl || selected.sourceUrl} alt="تصویر منبع" fill unoptimized className="object-cover" sizes="64px" />
                  </span>
                ) : null}
              </div>
              <div className="space-y-4 p-4">
                <div>
                  <h2 className="truncate text-sm font-semibold text-navy-950">{selected.project.title || "پروژه بدون عنوان"}</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    <StatusDot status={selected.project.status} />
                  </p>
                </div>

                <KeyValueList
                  items={[
                    {
                      label: "کاربر",
                      value: (
                        <Link href={`/admin/users/${selected.project.userId}`} className="hover:text-navy-700 hover:underline">
                          {getUserDisplayName(selected.project.user)}
                        </Link>
                      ),
                    },
                    { label: "شناسه کاربر", value: getUserIdentifier(selected.project.user), dir: "ltr" },
                    { label: "Vertical", value: getVerticalLabel(selected.project.vertical) },
                    {
                      label: "هزینه تولید",
                      value: formatInternalCreditUnits(
                        selected.project.creditReservations[0]?.creditUnits ?? getGenerationCreditUnitCost(normalizeVerticalId(selected.project.vertical)),
                      ),
                      dir: "ltr",
                    },
                    { label: "سبک", value: selected.project.style.name },
                    { label: "قالب خروجی", value: selected.project.outputPreset, dir: "ltr" },
                    { label: "تکمیل", value: formatAdminFullDate(selected.project.updatedAt) },
                  ]}
                />

                <div className="border-t border-slate-100 pt-3">
                  <Link href={`/admin/projects/${selected.project.id}`} className={btnSecondary}>
                    پرونده کامل پروژه
                  </Link>
                </div>
              </div>
            </Surface>
          ) : null}
        </div>
      )}
      <AdminPagination
        page={page}
        totalPages={totalPages}
        totalItems={totalOutputs}
        hrefForPage={(nextPage) => {
          const query = new URLSearchParams();
          if (q) query.set("q", q);
          if (vertical !== "ALL") query.set("vertical", vertical);
          if (nextPage > 1) query.set("page", String(nextPage));
          const value = query.toString();
          return `/admin/assets/outputs${value ? `?${value}` : ""}`;
        }}
      />
    </>
  );
}
