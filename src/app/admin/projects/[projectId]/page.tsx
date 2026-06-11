import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, Refresh } from "vuesax-icons-react";
import {
  adminDangerActionClass,
  adminPrimaryActionClass,
  adminSecondaryActionClass,
  adminTableCellClass,
  AdminDataTable,
  AdminDescriptionList,
  AdminEmptyState,
  AdminKpi,
  AdminKpiStrip,
  AdminPageHeader,
  AdminPanel,
  AdminStatus,
  formatAdminDate,
} from "@/features/admin/components/admin-ui";
import { archiveAdminProjectAction, retryAdminProjectAction } from "@/features/admin/actions";
import { getUserDisplayName, getUserIdentifier } from "@/lib/auth/user-identity";
import { uploadPreview } from "@/lib/placeholders/jewelry-images";
import { db } from "@/lib/db";
import { storageUrlFromKeyOrUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

type AdminProjectDetailPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function AdminProjectDetailPage({ params }: AdminProjectDetailPageProps) {
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
  const referenceUrl = project.referenceAsset ? storageUrlFromKeyOrUrl(project.referenceAsset.storageKey, project.referenceAsset.fileUrl) : null;

  return (
    <>
      <AdminPageHeader
        title={project.title || "پروژه بدون عنوان"}
        description={project.id}
        actions={
          <>
            <Link href="/admin/projects" className={adminSecondaryActionClass}>بازگشت به پروژه‌ها</Link>
            <form action={retryAdminProjectAction}>
              <input type="hidden" name="projectId" value={project.id} />
              <button className={adminPrimaryActionClass}>
                <Refresh className="h-4 w-4" />
                تلاش دوباره
              </button>
            </form>
            <form action={archiveAdminProjectAction}>
              <input type="hidden" name="projectId" value={project.id} />
              <button className={adminDangerActionClass}>
                <Archive className="h-4 w-4" />
                آرشیو
              </button>
            </form>
          </>
        }
      />

      <AdminKpiStrip>
        <AdminKpi label="وضعیت" value={<AdminStatus status={project.status} />} tone={project.status === "FAILED" ? "danger" : project.status === "COMPLETED" ? "success" : "attention"} />
        <AdminKpi label="Provider events" value={project.providerEvents.length} />
        <AdminKpi label="Credit reservations" value={project.creditReservations.length} />
        <AdminKpi label="عکس کمکی" value={project.supportingAssets.length} />
        <AdminKpi label="Batch" value={project.batchItems.length} />
      </AdminKpiStrip>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <AdminPanel title="تصاویر" description="منبع، خروجی، رفرنس و عکس‌های کمکی پروژه.">
          <div className="grid gap-4 p-4 md:grid-cols-2">
            <ImageBlock title="منبع" src={sourceUrl} />
            <ImageBlock title="خروجی" src={resultUrl || sourceUrl} muted={!resultUrl} />
            {referenceUrl ? <ImageBlock title="رفرنس سبک" src={referenceUrl} /> : null}
            {project.supportingAssets.map((item) => (
              <ImageBlock key={item.id} title={`عکس کمکی ${item.position.toLocaleString("fa-IR")}`} src={storageUrlFromKeyOrUrl(item.asset.storageKey, item.asset.fileUrl) || uploadPreview.src} />
            ))}
          </div>
        </AdminPanel>

        <div className="space-y-4">
          <AdminPanel title="جزئیات پروژه">
            <div className="p-4">
              <AdminDescriptionList
                items={[
                  { label: "کاربر", value: <Link href={`/admin/users/${project.userId}`} className="hover:underline">{getUserDisplayName(project.user)}</Link> },
                  { label: "شناسه کاربر", value: getUserIdentifier(project.user), dir: "ltr" },
                  { label: "سبک", value: project.style.name },
                  { label: "Preset", value: project.outputPreset, dir: "ltr" },
                  { label: "ساخته شده", value: formatAdminDate(project.createdAt) },
                  { label: "آپدیت", value: formatAdminDate(project.updatedAt) },
                  { label: "Source asset", value: project.sourceAssetId || "ندارد", dir: "ltr" },
                  { label: "Reference asset", value: project.referenceAssetId || "ندارد", dir: "ltr" },
                ]}
              />
              {project.errorMessage ? <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{project.errorMessage}</p> : null}
            </div>
          </AdminPanel>

          <AdminPanel title="Prompt داخلی">
            <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap bg-slate-950 p-4 text-left text-xs leading-6 text-slate-100" dir="ltr">
              {project.prompt}
            </pre>
          </AdminPanel>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AdminPanel title="Provider timeline">
          <AdminDataTable headers={["وضعیت", "Provider", "Operation", "جزئیات", "زمان"]} empty={<AdminEmptyState title="رویداد provider ثبت نشده است." />}>
            {project.providerEvents.map((event) => (
              <tr key={event.id}>
                <td className={adminTableCellClass}><AdminStatus status={event.status} /></td>
                <td className={adminTableCellClass} dir="ltr">{event.provider}<p className="text-xs text-slate-500">{event.model || "model unknown"}</p></td>
                <td className={adminTableCellClass} dir="ltr">{event.operation}<p className="text-xs text-slate-500">retry {event.retryCount}</p></td>
                <td className={adminTableCellClass}>
                  <p className="max-w-md truncate text-xs text-slate-600">{event.errorMessage || event.statusDetail || "بدون جزئیات"}</p>
                </td>
                <td className={adminTableCellClass}>{formatAdminDate(event.createdAt)}</td>
              </tr>
            ))}
          </AdminDataTable>
        </AdminPanel>

        <AdminPanel title="Credit reservations">
          <AdminDataTable headers={["منبع", "وضعیت", "Subscription", "زمان"]} empty={<AdminEmptyState title="رزرو اعتباری ثبت نشده است." />}>
            {project.creditReservations.map((reservation) => (
              <tr key={reservation.id}>
                <td className={adminTableCellClass}><AdminStatus status={reservation.source} /></td>
                <td className={adminTableCellClass}><AdminStatus status={reservation.status} /></td>
                <td className={adminTableCellClass} dir="ltr">{reservation.subscriptionId || "wallet"}</td>
                <td className={adminTableCellClass}>{formatAdminDate(reservation.createdAt)}</td>
              </tr>
            ))}
          </AdminDataTable>
        </AdminPanel>
      </div>
    </>
  );
}

function ImageBlock({ title, src, muted = false }: { title: string; src: string; muted?: boolean }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-slate-600">{title}</p>
      <div className={`relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100 ${muted ? "opacity-60" : ""}`}>
        <Image src={src} alt="" fill unoptimized className="object-cover" sizes="420px" />
      </div>
    </div>
  );
}
