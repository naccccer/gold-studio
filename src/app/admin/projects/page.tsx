import Image from "next/image";
import Link from "next/link";
import { Archive, RefreshCw } from "lucide-react";
import {
  adminDangerActionClass,
  adminInputClass,
  adminPrimaryActionClass,
  AdminMetric,
  AdminRow,
  AdminSection,
  AdminStatus,
  EmptyAdminState,
  formatAdminDate,
} from "@/features/admin/components/admin-ui";
import { archiveAdminProjectAction, retryAdminProjectAction } from "@/features/admin/actions";
import { getUserDisplayName, getUserIdentifier } from "@/lib/auth/user-identity";
import { uploadPreview } from "@/lib/placeholders/jewelry-images";
import { db } from "@/lib/db";
import { storageUrlFromKeyOrUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

type AdminProjectsPageProps = {
  searchParams?: Promise<{ status?: string; q?: string; styleId?: string; archived?: string; projectId?: string }>;
};

export default async function AdminProjectsPage({ searchParams }: AdminProjectsPageProps) {
  const params = await searchParams;
  const status = params?.status;
  const q = params?.q?.trim();
  const styleId = params?.styleId;
  const includeArchived = params?.archived === "all";
  const selectedProjectId = params?.projectId;

  const where = {
    ...(includeArchived ? {} : { archivedAt: null }),
    ...(status && status !== "ALL" ? { status: status as "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" } : {}),
    ...(styleId ? { styleId } : {}),
    ...(q
      ? {
          OR: [
            { id: { contains: q } },
            { title: { contains: q } },
            { errorMessage: { contains: q } },
            { user: { OR: [{ email: { contains: q } }, { phone: { contains: q } }, { name: { contains: q } }] } },
          ],
        }
      : {}),
  };

  const [projects, styles, counts, selectedProject] = await Promise.all([
    db.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 80,
      include: { user: true, style: { select: { id: true, name: true } }, sourceAsset: { select: { storageKey: true } } },
    }),
    db.creativeStyle.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true, name: true } }),
    Promise.all([
      db.project.count({ where: { status: "QUEUED", archivedAt: null } }),
      db.project.count({ where: { status: "PROCESSING", archivedAt: null } }),
      db.project.count({ where: { status: "COMPLETED", archivedAt: null } }),
      db.project.count({ where: { status: "FAILED", archivedAt: null } }),
    ]),
    selectedProjectId
      ? db.project.findUnique({
          where: { id: selectedProjectId },
          include: {
            user: true,
            style: true,
            sourceAsset: true,
            providerEvents: { orderBy: { createdAt: "desc" }, take: 10 },
          },
        })
      : null,
  ]);

  return (
    <>
      <section className="grid gap-2.5 sm:grid-cols-4">
        <AdminMetric label="در صف" value={counts[0]} />
        <AdminMetric label="پردازش" value={counts[1]} />
        <AdminMetric label="تکمیل" value={counts[2]} />
        <AdminMetric label="ناموفق" value={counts[3]} />
      </section>

      <AdminSection title="فیلتر پروژه‌ها" eyebrow="وضعیت، کاربر، سبک">
        <form className="grid gap-2 md:grid-cols-[1fr_140px_180px_130px_auto]">
          <input name="q" defaultValue={q} placeholder="شناسه، عنوان، خطا یا کاربر" className={adminInputClass} />
          <select name="status" defaultValue={status ?? "ALL"} className={adminInputClass}>
            <option value="ALL">همه وضعیت‌ها</option>
            <option value="QUEUED">در صف</option>
            <option value="PROCESSING">پردازش</option>
            <option value="COMPLETED">تکمیل‌شده</option>
            <option value="FAILED">ناموفق</option>
          </select>
          <select name="styleId" defaultValue={styleId ?? ""} className={adminInputClass}>
            <option value="">همه سبک‌ها</option>
            {styles.map((style) => (
              <option key={style.id} value={style.id}>{style.name}</option>
            ))}
          </select>
          <select name="archived" defaultValue={includeArchived ? "all" : "active"} className={adminInputClass}>
            <option value="active">فعال</option>
            <option value="all">همراه آرشیو</option>
          </select>
          <button className={adminPrimaryActionClass}>اعمال</button>
        </form>
      </AdminSection>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <AdminSection title="لیست پروژه‌ها" eyebrow={`${projects.length.toLocaleString("fa-IR")} مورد`}>
          {projects.length === 0 ? (
            <EmptyAdminState>پروژه‌ای با این فیلتر پیدا نشد.</EmptyAdminState>
          ) : (
            projects.map((project) => (
              <AdminRow key={project.id}>
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-surface-soft">
                    <Image
                      src={
                        storageUrlFromKeyOrUrl(project.resultStorageKey, project.resultImageUrl) ||
                        storageUrlFromKeyOrUrl(project.sourceAsset?.storageKey, project.sourceImageUrl) ||
                        uploadPreview.src
                      }
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div className="min-w-0">
                    <Link href={`/admin/projects?projectId=${project.id}`} className="font-semibold text-foreground hover:underline">
                      {project.title || "پروژه بدون عنوان"}
                    </Link>
                    <p className="truncate text-xs text-muted">{getUserDisplayName(project.user)} · {project.style.name}</p>
                  </div>
                </div>
                <div className="text-xs text-muted">
                  <p>{formatAdminDate(project.createdAt)}</p>
                  <p className="truncate">{project.errorMessage || "بدون خطای ثبت‌شده"}</p>
                </div>
                <AdminStatus status={project.status} />
              </AdminRow>
            ))
          )}
        </AdminSection>

        <AdminSection title="جزئیات پروژه" eyebrow="منبع، خروجی، خطا و رویدادها">
          {!selectedProject ? (
            <EmptyAdminState>برای مشاهده جزئیات، یک پروژه را انتخاب کنید.</EmptyAdminState>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-2 text-xs text-muted">تصویر منبع</p>
                  <div className="relative aspect-square overflow-hidden rounded-[var(--radius-md)] bg-surface-soft">
                    <Image
                      src={storageUrlFromKeyOrUrl(selectedProject.sourceAsset?.storageKey, selectedProject.sourceImageUrl) || uploadPreview.src}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="220px"
                    />
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs text-muted">خروجی</p>
                  <div className="relative aspect-square overflow-hidden rounded-[var(--radius-md)] bg-surface-soft">
                    <Image
                      src={
                        storageUrlFromKeyOrUrl(selectedProject.resultStorageKey, selectedProject.resultImageUrl) ||
                        storageUrlFromKeyOrUrl(selectedProject.sourceAsset?.storageKey, selectedProject.sourceImageUrl) ||
                        uploadPreview.src
                      }
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="220px"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-1 text-xs leading-6 text-muted">
                <p>کاربر: {getUserDisplayName(selectedProject.user)} · <span dir="ltr">{getUserIdentifier(selectedProject.user)}</span></p>
                <p>سبک: {selectedProject.style.name}</p>
                <p dir="ltr">Project ID: {selectedProject.id}</p>
                {selectedProject.sourceAsset ? <p dir="ltr">Storage: {selectedProject.sourceAsset.storageKey}</p> : null}
                {selectedProject.errorMessage ? <p className="text-danger">خطا: {selectedProject.errorMessage}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={retryAdminProjectAction}>
                  <input type="hidden" name="projectId" value={selectedProject.id} />
                  <button className={adminPrimaryActionClass}>
                    <RefreshCw className="h-4 w-4" />
                    تلاش دوباره
                  </button>
                </form>
                <form action={archiveAdminProjectAction}>
                  <input type="hidden" name="projectId" value={selectedProject.id} />
                  <button className={adminDangerActionClass}>
                    <Archive className="h-4 w-4" />
                    آرشیو
                  </button>
                </form>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-foreground">پرامپت داخلی</p>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-[var(--radius-md)] bg-surface-soft p-3 text-left text-[11px] leading-5 text-muted" dir="ltr">
                  {selectedProject.prompt}
                </pre>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-foreground">رویدادهای Provider</p>
                {selectedProject.providerEvents.length === 0 ? (
                  <EmptyAdminState>رویدادی ثبت نشده است.</EmptyAdminState>
                ) : (
                  selectedProject.providerEvents.map((event) => (
                    <AdminRow key={event.id} className="md:grid-cols-[1fr_auto]">
                      <div>
                        <p className="text-xs font-semibold text-foreground">{event.operation} · {event.model || "model unknown"}</p>
                        <p className="text-xs text-muted">{event.errorMessage || event.statusDetail || "بدون پیام خطا"}</p>
                      </div>
                      <AdminStatus status={event.status} />
                    </AdminRow>
                  ))
                )}
              </div>
            </div>
          )}
        </AdminSection>
      </div>
    </>
  );
}
