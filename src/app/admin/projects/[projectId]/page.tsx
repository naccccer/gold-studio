import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, Refresh } from "vuesax-icons-react";
import {
  btnDanger,
  btnPrimary,
  cellClass,
  ConsoleHeader,
  ConsoleTable,
  Disclosure,
  EmptyState,
  faNum,
  formatAdminDate,
  KeyValueList,
  StatusDot,
  Surface,
} from "@/features/admin/components/console";
import { AdminImagePreview } from "@/features/admin/components/admin-image-preview";
import { archiveAdminProjectAction, retryAdminProjectAction } from "@/features/admin/actions";
import { getUserDisplayName, getUserIdentifier } from "@/lib/auth/user-identity";
import { uploadPreview } from "@/lib/placeholders/jewelry-images";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/session";
import { storageThumbnailUrlFromKeyOrUrl, storageUrlFromKeyOrUrl } from "@/lib/storage";
import { formatInternalCreditUnits, getGenerationCreditUnitCost } from "@/lib/credit-units";
import { projectGenerationTiming } from "@/lib/generation/timing";
import { getVerticalLabel, normalizeVerticalId } from "@/lib/verticals";

export const dynamic = "force-dynamic";

type AdminProjectDetailPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function AdminProjectDetailPage({ params }: AdminProjectDetailPageProps) {
  await requireAdminSession();

  const { projectId } = await params;
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      user: true,
      style: true,
      sourceAsset: true,
      referenceAsset: true,
      supportingAssets: { orderBy: { position: "asc" }, include: { asset: true } },
      providerEvents: { orderBy: { createdAt: "desc" }, take: 50 },
      creditReservations: { orderBy: { createdAt: "desc" }, take: 10 },
      batchItems: { include: { batch: true } },
    },
  });

  if (!project) notFound();

  const sourceUrl = storageUrlFromKeyOrUrl(project.sourceAsset?.storageKey, project.sourceImageUrl) || uploadPreview.src;
  const resultUrl = storageUrlFromKeyOrUrl(project.resultStorageKey, project.resultImageUrl);
  const referenceUrl = project.referenceAsset
    ? storageUrlFromKeyOrUrl(project.referenceAsset.storageKey, project.referenceAsset.fileUrl)
    : null;
  const defaultCostUnits = getGenerationCreditUnitCost(normalizeVerticalId(project.vertical));
  const latestReservation = project.creditReservations[0];
  const operationalCostUnits = latestReservation?.creditUnits ?? defaultCostUnits;
  const generationTiming = projectGenerationTiming(project);
  const formatSeconds = (seconds: number | null) => seconds === null ? "ثبت نشده" : `${faNum(seconds)} ثانیه`;
  const formatDurationMs = (durationMs: number | null) => durationMs === null ? "ثبت نشده" : `${faNum(Math.round(durationMs / 1000))} ثانیه`;
  const currentRunEvents = project.generationStartedAt
    ? project.providerEvents.filter((event) => event.createdAt >= project.generationStartedAt!)
    : project.providerEvents;
  const providerDurationMs = currentRunEvents.reduce((total, event) => total + (event.durationMs ?? 0), 0);
  const resolvedProviderCosts = project.providerEvents.filter((event) => event.costResolvedAt);
  const providerCostIrt = resolvedProviderCosts.reduce(
    (total, event) => total + Number(event.costPaidIrt ?? 0) + Number(event.costGrantIrt ?? 0),
    0,
  );
  const providerCostUnit = resolvedProviderCosts.reduce((total, event) => {
    const irt = Number(event.costPaidIrt ?? 0) + Number(event.costGrantIrt ?? 0);
    return irt === 0 ? total + Number(event.costUnit ?? 0) : total;
  }, 0);
  const providerCostPending = project.providerEvents.some((event) => event.requestId && !event.costResolvedAt);
  const formatProviderCost = (value: number) => `${faNum(Math.round(value))} تومان`;
  const formatResolvedProviderCost = (event: (typeof project.providerEvents)[number]) => {
    const irt = Number(event.costPaidIrt ?? 0) + Number(event.costGrantIrt ?? 0);
    const unit = Number(event.costUnit ?? 0);
    return irt > 0 || unit === 0 ? formatProviderCost(irt) : `${unit.toFixed(6)} UNIT`;
  };

  return (
    <>
      <ConsoleHeader
        backHref="/admin/projects"
        backLabel="صف تولید"
        title={project.title || "پروژه بدون عنوان"}
        meta={
          <>
            <StatusDot status={project.status} />
            <span dir="ltr" className="text-slate-400">
              {project.id}
            </span>
            <span>{formatAdminDate(project.createdAt)}</span>
          </>
        }
        actions={
          <>
            <form action={retryAdminProjectAction}>
              <input type="hidden" name="projectId" value={project.id} />
              <button className={btnPrimary}>
                <Refresh className="h-4 w-4" />
                تلاش دوباره
              </button>
            </form>
            <form action={archiveAdminProjectAction}>
              <input type="hidden" name="projectId" value={project.id} />
              <button className={btnDanger}>
                <Archive className="h-4 w-4" />
                آرشیو
              </button>
            </form>
          </>
        }
      />

      {project.errorMessage ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium leading-7 text-rose-700">{project.errorMessage}</p>
      ) : null}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Surface>
          <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
            <ImageBlock
              title="منبع"
              originalSrc={sourceUrl}
              thumbnailSrc={storageThumbnailUrlFromKeyOrUrl(project.sourceAsset?.storageKey, project.sourceImageUrl, "preview") || sourceUrl}
            />
            <ImageBlock
              title="خروجی"
              originalSrc={resultUrl || sourceUrl}
              thumbnailSrc={
                storageThumbnailUrlFromKeyOrUrl(project.resultStorageKey, project.resultImageUrl, "preview") ||
                storageThumbnailUrlFromKeyOrUrl(project.sourceAsset?.storageKey, project.sourceImageUrl, "preview") ||
                sourceUrl
              }
              muted={!resultUrl}
            />
            {referenceUrl && project.referenceAsset ? (
              <ImageBlock
                title="عکس نمونه"
                originalSrc={referenceUrl}
                thumbnailSrc={storageThumbnailUrlFromKeyOrUrl(project.referenceAsset.storageKey, project.referenceAsset.fileUrl, "preview") || referenceUrl}
              />
            ) : null}
            {project.supportingAssets.map((item) => (
              <ImageBlock
                key={item.id}
                title={`عکس کمکی ${faNum(item.position)}`}
                originalSrc={storageUrlFromKeyOrUrl(item.asset.storageKey, item.asset.fileUrl) || uploadPreview.src}
                thumbnailSrc={storageThumbnailUrlFromKeyOrUrl(item.asset.storageKey, item.asset.fileUrl, "preview") || uploadPreview.src}
              />
            ))}
          </div>
        </Surface>

        <div className="min-w-0 space-y-4">
          <Surface className="p-5">
            <KeyValueList
              items={[
                {
                  label: "کاربر",
                  value: (
                    <Link href={`/admin/users/${project.userId}`} className="hover:text-navy-700 hover:underline">
                      {getUserDisplayName(project.user)}
                    </Link>
                  ),
                },
                { label: "شناسه کاربر", value: getUserIdentifier(project.user), dir: "ltr" },
                { label: "Vertical", value: getVerticalLabel(project.vertical) },
                { label: "هزینه اعتباری کاربر", value: formatInternalCreditUnits(operationalCostUnits), dir: "ltr" },
                {
                  label: "کل هزینه واقعی پروژه",
                  value: resolvedProviderCosts.length
                    ? [providerCostIrt > 0 ? formatProviderCost(providerCostIrt) : null, providerCostUnit > 0 ? `${providerCostUnit.toFixed(6)} UNIT` : null]
                        .filter(Boolean)
                        .join(" + ") || formatProviderCost(0)
                    : providerCostPending
                      ? "در انتظار تطبیق"
                      : "ثبت نشده",
                },
                { label: "سبک", value: project.style.name },
                { label: "قالب خروجی", value: project.outputPreset, dir: "ltr" },
                { label: "زمان کل ساخت", value: formatSeconds(generationTiming.totalSeconds) },
                { label: "انتظار در صف", value: formatSeconds(generationTiming.queueSeconds) },
                { label: "پردازش", value: formatSeconds(generationTiming.processingSeconds) },
                { label: "آماده‌سازی ورودی", value: formatDurationMs(project.generationPrepareDurationMs) },
                { label: "پاسخ مدل‌ها", value: providerDurationMs ? formatDurationMs(providerDurationMs) : "ثبت نشده" },
                { label: "ذخیره خروجی", value: formatDurationMs(project.generationPersistDurationMs) },
                { label: "آخرین آپدیت", value: formatAdminDate(project.updatedAt) },
                { label: "Batch", value: project.batchItems.length ? faNum(project.batchItems.length) : "ندارد" },
              ]}
            />
          </Surface>

          <Disclosure summary="پرامپت داخلی">
            <pre
              dir="ltr"
              className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-navy-950 px-4 py-3 text-left font-mono text-xs leading-6 text-navy-100"
            >
              {project.prompt}
            </pre>
          </Disclosure>

          <Disclosure summary={`رزروهای اعتبار (${faNum(project.creditReservations.length)})`}>
            {project.creditReservations.length === 0 ? (
              <EmptyState title="رزرو اعتباری ثبت نشده است." />
            ) : (
              <div className="divide-y divide-slate-100">
                {project.creditReservations.map((reservation) => (
                  <div key={reservation.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs first:pt-0 last:pb-0">
                    <span className="flex items-center gap-3">
                      <StatusDot status={reservation.source} />
                      <StatusDot status={reservation.status} />
                    </span>
                    <span className="font-medium text-navy-950" dir="ltr">
                      {formatInternalCreditUnits(reservation.creditUnits)}
                    </span>
                    <span className="text-slate-400">{formatAdminDate(reservation.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </Disclosure>
        </div>
      </div>

      <Surface>
        <div className="border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-navy-950">رویدادهای Provider</h2>
        </div>
        <ConsoleTable
          head={["وضعیت", "Provider", "عملیات", "مدت", "هزینه واقعی", "جزئیات", "زمان"]}
          empty={<EmptyState title="رویداد provider ثبت نشده است." />}
        >
          {project.providerEvents.map((event) => (
            <tr key={event.id}>
              <td className={cellClass}>
                <StatusDot status={event.status} />
              </td>
              <td className={cellClass} dir="ltr">
                {event.provider}
                <p className="text-xs text-slate-400">{event.model || "model unknown"}</p>
                {event.requestId ? <p className="max-w-40 truncate text-[10px] text-slate-400" title={event.requestId}>{event.requestId}</p> : null}
              </td>
              <td className={cellClass} dir="ltr">
                {event.operation}
                <p className="text-xs text-slate-400">retry {event.retryCount}</p>
              </td>
              <td className={`${cellClass} text-xs text-slate-500`} dir="ltr">
                {event.durationMs === null ? "—" : `${faNum(Math.round(event.durationMs / 1000))} ثانیه`}
              </td>
              <td className={cellClass}>
                {event.costResolvedAt ? (
                  formatResolvedProviderCost(event)
                ) : event.requestId ? (
                  <span className="text-xs text-slate-400">در انتظار تطبیق</span>
                ) : (
                  "—"
                )}
              </td>
              <td className={cellClass}>
                <p className="max-w-md truncate text-xs text-slate-500">{event.errorMessage || event.statusDetail || "بدون جزئیات"}</p>
              </td>
              <td className={`${cellClass} text-xs text-slate-500`}>{formatAdminDate(event.createdAt)}</td>
            </tr>
          ))}
        </ConsoleTable>
      </Surface>
    </>
  );
}

function ImageBlock({ title, thumbnailSrc, originalSrc, muted = false }: { title: string; thumbnailSrc: string; originalSrc: string; muted?: boolean }) {
  return (
    <figure className="m-0">
      <AdminImagePreview
        thumbnailSrc={thumbnailSrc}
        originalSrc={originalSrc}
        alt={title}
        sizes="320px"
        className={`aspect-square w-full rounded-xl bg-slate-100 ${muted ? "opacity-50" : ""}`}
      />
      <figcaption className="mt-1.5 text-[11px] font-medium text-slate-500">{title}</figcaption>
    </figure>
  );
}
