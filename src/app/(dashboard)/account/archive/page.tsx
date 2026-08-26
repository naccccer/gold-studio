import { ArchiveBook, Refresh } from "vuesax-icons-react";
import { redirect } from "next/navigation";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { EmptyState } from "@/components/ui/empty-state";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import { PageShell } from "@/components/ui/page-shell";
import { PaginationNav } from "@/components/ui/pagination-nav";
import { SafeJewelryImage } from "@/components/ui/safe-jewelry-image";
import { accountCardClass } from "@/features/account/components/account-subpage";
import { deleteArchivedProjectAction, restoreProjectAction } from "@/features/projects/actions";
import { requireUserSession } from "@/lib/auth/session";
import { getCurrentVertical } from "@/lib/current-vertical";
import { db } from "@/lib/db";
import { archiveItems } from "@/lib/placeholders/jewelry-images";
import { storagePublicUrl, storageThumbnailUrlFromKeyOrUrl } from "@/lib/storage";
import { projectGenerationTiming } from "@/lib/generation/timing";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

export default async function AccountArchivePage({ searchParams }: { searchParams?: Promise<{ page?: string }> }) {
  const session = await requireUserSession();
  const vertical = await getCurrentVertical();
  const params = await searchParams;
  const requestedPage = Number.parseInt(params?.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const where = { userId: session.userId, vertical, archivedAt: { not: null } };
  const [projectRows, totalItems] = await Promise.all([
    db.project.findMany({
      where,
      orderBy: { archivedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        style: { select: { name: true } },
        sourceAsset: { select: { storageKey: true } },
      },
    }),
    db.project.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  if (page > totalPages) redirect(totalPages > 1 ? `/account/archive?page=${totalPages}` : "/account/archive");
  const projects = projectRows.map((project) => ({
    ...project,
    sourceImageUrl: project.sourceAsset?.storageKey ? storagePublicUrl(project.sourceAsset.storageKey) : project.sourceImageUrl,
    resultImageUrl: project.resultStorageKey ? storagePublicUrl(project.resultStorageKey) : project.resultImageUrl,
    sourceThumbnailUrl: storageThumbnailUrlFromKeyOrUrl(project.sourceAsset?.storageKey, project.sourceImageUrl, "card"),
    resultThumbnailUrl: storageThumbnailUrlFromKeyOrUrl(project.resultStorageKey, project.resultImageUrl, "card"),
    generationDurationSeconds: projectGenerationTiming(project).totalSeconds,
  }));

  return (
    <PageShell maxWidth="lg" className="space-y-3 pb-32">
      <header className="flex items-center gap-3 px-1">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-wash text-accent-deep">
            <ArchiveBook aria-hidden={true} className="h-4.5 w-4.5" />
          </span>
          <h1 className="truncate text-base font-semibold text-foreground">آرشیو</h1>
        </div>
      </header>

      {projects.length === 0 ? (
        <section className={accountCardClass}>
          <EmptyState
            title="آرشیو شما خالی است."
            action={
              <ButtonLink href="/projects" variant="secondary" className="h-11 rounded-[1rem]">
                رفتن به پروژه‌ها
              </ButtonLink>
            }
          />
        </section>
      ) : (
        <section className="grid grid-cols-2 gap-3">
          {projects.map((project, index) => {
            const fallback = archiveItems[index % archiveItems.length];
            const imageSrc =
              project.resultThumbnailUrl?.trim() ||
              project.sourceThumbnailUrl?.trim() ||
              project.resultImageUrl?.trim() ||
              project.sourceImageUrl?.trim() ||
              fallback.src;
            const title = project.title?.trim() || "پروژه محصول";

            return (
              <article key={project.id} className="relative">
                <JewelryImageFrame aspect="gallery" className="rounded-[var(--radius-lg)]">
                  <SafeJewelryImage
                    src={imageSrc}
                    fallbackSrc={fallback.src}
                    fallbackAlt={fallback.alt}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="84px"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/24 via-40% to-transparent px-2.5 pb-2 pt-8">
                    <div
                      className="absolute inset-x-0 bottom-0 z-0 h-16 bg-black/12 backdrop-blur-[2px] [mask-image:linear-gradient(to_top,black_0%,rgba(0,0,0,0.72)_40%,transparent_100%)]"
                      aria-hidden={true}
                    />
                    <div className="relative z-10 min-w-0 space-y-1.5">
                      <p className="truncate text-xs font-semibold leading-5 text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">{title}</p>
                      {project.generationDurationSeconds !== null ? (
                        <p className="text-[10px] leading-4 text-white/72">{project.generationDurationSeconds.toLocaleString("fa-IR")} ثانیه</p>
                      ) : null}
                    </div>
                  </div>
                </JewelryImageFrame>
                <form action={restoreProjectAction} className="absolute left-2 top-2 z-20">
                  <input type="hidden" name="projectId" value={project.id} />
                  <button
                    type="submit"
                    className={buttonClasses({
                      variant: "secondary",
                      size: "sm",
                      className: "!h-7 !min-h-7 rounded-full border border-white/32 bg-surface/88 px-2 text-[10px] leading-none shadow-[0_12px_24px_-18px_rgba(0,0,0,0.65)] backdrop-blur",
                    })}
                  >
                    <Refresh aria-hidden={true} className="h-3 w-3" />
                    بازگردانی
                  </button>
                </form>
                <ConfirmAction
                  action={deleteArchivedProjectAction}
                  fields={[{ name: "projectId", value: project.id }]}
                  title="حذف دائمی پروژه؟"
                  description="این پروژه از آرشیو حذف می‌شود و دیگر قابل بازگردانی نیست."
                  confirmLabel="حذف دائمی"
                  triggerLabel="حذف"
                  triggerIcon="trash"
                  triggerClassName={buttonClasses({
                    variant: "danger",
                    size: "sm",
                    className:
                      "absolute right-2 top-2 z-20 !h-7 !min-h-7 rounded-full border border-white/24 bg-danger-bright/92 px-2 text-[10px] leading-none shadow-[0_12px_24px_-18px_rgba(0,0,0,0.72)] backdrop-blur",
                  })}
                />
              </article>
            );
          })}
        </section>
      )}
      <PaginationNav
        pagination={{
          page,
          totalPages,
          totalItems,
          previousHref: page > 1 ? `/account/archive?page=${page - 1}` : null,
          nextHref: page < totalPages ? `/account/archive?page=${page + 1}` : null,
        }}
      />
    </PageShell>
  );
}
