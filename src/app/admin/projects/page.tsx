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
  inlineFieldClass,
  formatAdminDate,
  SegmentedLinks,
  StatusDot,
  Surface,
} from "@/features/admin/components/console";
import { getUserDisplayName, getUserIdentifier } from "@/lib/auth/user-identity";
import { uploadPreview } from "@/lib/placeholders/jewelry-images";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/session";
import { storageUrlFromKeyOrUrl } from "@/lib/storage";
import { getVerticalLabel, normalizeVerticalId, USER_VISIBLE_VERTICAL_IDS, VERTICALS } from "@/lib/verticals";

export const dynamic = "force-dynamic";

type AdminProjectsPageProps = {
  searchParams?: Promise<{ status?: string; q?: string; styleId?: string; archived?: string; vertical?: string }>;
};

const statusFilters = [
  { value: "ALL", label: "همه" },
  { value: "QUEUED", label: "در صف" },
  { value: "PROCESSING", label: "در پردازش" },
  { value: "FAILED", label: "ناموفق" },
  { value: "COMPLETED", label: "تکمیل‌شده" },
];

function buildQuery(params: { status?: string; q?: string; styleId?: string; archived?: string; vertical?: string }) {
  const query = new URLSearchParams();
  if (params.status && params.status !== "ALL") query.set("status", params.status);
  if (params.q) query.set("q", params.q);
  if (params.styleId) query.set("styleId", params.styleId);
  if (params.vertical && params.vertical !== "ALL") query.set("vertical", params.vertical);
  if (params.archived === "all") query.set("archived", "all");
  const value = query.toString();
  return value ? `?${value}` : "";
}

export default async function AdminProjectsPage({ searchParams }: AdminProjectsPageProps) {
  await requireAdminSession();

  const params = await searchParams;
  const status = params?.status && params.status !== "ALL" ? params.status : "ALL";
  const q = params?.q?.trim();
  const styleId = params?.styleId;
  const includeArchived = params?.archived === "all";
  const vertical = params?.vertical && params.vertical !== "ALL" ? normalizeVerticalId(params.vertical) : "ALL";

  const where: Prisma.ProjectWhereInput = {
    ...(includeArchived ? {} : { archivedAt: null }),
    ...(status !== "ALL" ? { status: status as "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" } : {}),
    ...(styleId ? { styleId } : {}),
    ...(vertical === "ALL" ? {} : { vertical }),
    ...(q
      ? {
          OR: [
            { id: { contains: q } },
            { title: { contains: q } },
            { vertical: { contains: q } },
            { errorMessage: { contains: q } },
            { prompt: { contains: q } },
            { user: { OR: [{ email: { contains: q } }, { phone: { contains: q } }, { name: { contains: q } }] } },
          ],
        }
      : {}),
  };

  const [projects, styles, queued, processing, failed, completed] = await Promise.all([
    db.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 120,
      include: {
        user: true,
        style: { select: { id: true, name: true } },
        sourceAsset: { select: { storageKey: true } },
        providerEvents: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    db.creativeStyle.findMany({
      where: vertical === "ALL" ? undefined : { vertical },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true },
    }),
    db.project.count({ where: { status: "QUEUED", archivedAt: null } }),
    db.project.count({ where: { status: "PROCESSING", archivedAt: null } }),
    db.project.count({ where: { status: "FAILED", archivedAt: null } }),
    db.project.count({ where: { status: "COMPLETED", archivedAt: null } }),
  ]);

  const countByStatus: Record<string, number | undefined> = {
    QUEUED: queued,
    PROCESSING: processing,
    FAILED: failed,
    COMPLETED: completed,
  };

  return (
    <>
      <ConsoleHeader
        title="صف تولید"
        meta={
          <span>
            {faNum(queued + processing)} در جریان · {failed > 0 ? <span className="font-medium text-rose-700">{faNum(failed)} ناموفق</span> : "بدون شکست فعال"}
          </span>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedLinks
          items={statusFilters.map((item) => ({
            href: `/admin/projects${buildQuery({ status: item.value, q, styleId, archived: params?.archived, vertical })}`,
            label: item.label,
            active: status === item.value,
            count: countByStatus[item.value],
          }))}
        />
        <form className="flex flex-wrap items-center gap-2">
          {status !== "ALL" ? <input type="hidden" name="status" value={status} /> : null}
          <input name="q" defaultValue={q} placeholder="جست‌وجو در پروژه‌ها و کاربران" className={`${inlineFieldClass} w-56`} />
          <select name="vertical" defaultValue={vertical} className={`${inlineFieldClass} w-36`}>
            <option value="ALL">All verticals</option>
            {USER_VISIBLE_VERTICAL_IDS.map((item) => (
              <option key={item} value={item}>
                {VERTICALS[item].label}
              </option>
            ))}
          </select>
          <select name="styleId" defaultValue={styleId ?? ""} className={`${inlineFieldClass} w-36`}>
            <option value="">همه سبک‌ها</option>
            {styles.map((style) => (
              <option key={style.id} value={style.id}>
                {style.name}
              </option>
            ))}
          </select>
          <select name="archived" defaultValue={includeArchived ? "all" : "active"} className={`${inlineFieldClass} w-28`}>
            <option value="active">فعال</option>
            <option value="all">با آرشیو</option>
          </select>
          <button className={`${btnSecondary} h-8`}>اعمال</button>
        </form>
      </div>

      <Surface>
        <ConsoleTable
          head={["پروژه", "کاربر", "Vertical", "سبک", "وضعیت", "آخرین رویداد", "زمان"]}
          empty={<EmptyState title="پروژه‌ای با این فیلتر پیدا نشد." />}
        >
          {projects.map((project) => {
            const preview =
              storageUrlFromKeyOrUrl(project.resultStorageKey, project.resultImageUrl) ||
              storageUrlFromKeyOrUrl(project.sourceAsset?.storageKey, project.sourceImageUrl) ||
              uploadPreview.src;
            const lastEvent = project.providerEvents[0];

            return (
              <tr key={project.id}>
                <td className={cellClass}>
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      <Image src={preview} alt="" fill unoptimized className="object-cover" sizes="40px" />
                    </span>
                    <span className="min-w-0">
                      <Link href={`/admin/projects/${project.id}`} className="block truncate font-medium hover:text-navy-700 hover:underline">
                        {project.title || "پروژه بدون عنوان"}
                      </Link>
                      {project.status === "FAILED" && project.errorMessage ? (
                        <span className="block max-w-60 truncate text-xs text-rose-600">{project.errorMessage}</span>
                      ) : (
                        <span className="block truncate text-[11px] text-slate-400" dir="ltr">
                          {project.id}
                        </span>
                      )}
                    </span>
                  </div>
                </td>
                <td className={cellClass}>
                  <Link href={`/admin/users/${project.userId}`} className="font-medium hover:text-navy-700 hover:underline">
                    {getUserDisplayName(project.user)}
                  </Link>
                  <p className="text-xs text-slate-400" dir="ltr">
                    {getUserIdentifier(project.user)}
                  </p>
                </td>
                <td className={cellClass}>
                  {getVerticalLabel(project.vertical)}
                </td>
                <td className={cellClass}>
                  <p>{project.style.name}</p>
                  <p className="text-xs text-slate-400" dir="ltr">
                    {project.outputPreset}
                  </p>
                </td>
                <td className={cellClass}>
                  <StatusDot status={project.status} />
                </td>
                <td className={cellClass}>
                  {lastEvent ? (
                    <>
                      <StatusDot status={lastEvent.status} />
                      <p className="mt-0.5 text-[11px] text-slate-400" dir="ltr">
                        {lastEvent.provider}/{lastEvent.model || "unknown"}
                      </p>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400">بدون رویداد</span>
                  )}
                </td>
                <td className={`${cellClass} text-xs text-slate-500`}>{formatAdminDate(project.createdAt)}</td>
              </tr>
            );
          })}
        </ConsoleTable>
      </Surface>
    </>
  );
}
