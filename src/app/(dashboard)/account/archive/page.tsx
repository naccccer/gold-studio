import { Archive, RefreshCw } from "lucide-react";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ImageFrame } from "@/components/ui/image-frame";

import { PageShell } from "@/components/ui/page-shell";
import { SafeJewelryImage } from "@/components/ui/safe-jewelry-image";
import { accountCardClass } from "@/features/account/components/account-subpage";
import { restoreProjectAction } from "@/features/projects/actions";
import { requireUserSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { archiveItems } from "@/lib/placeholders/jewelry-images";
import { storagePublicUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function AccountArchivePage() {
  const session = await requireUserSession();
  const projects = (await db.project.findMany({
    where: { userId: session.userId, archivedAt: { not: null } },
    orderBy: { archivedAt: "desc" },
    include: {
      style: { select: { name: true } },
      sourceAsset: { select: { storageKey: true } },
    },
  })).map((project) => ({
    ...project,
    sourceImageUrl: project.sourceAsset?.storageKey ? storagePublicUrl(project.sourceAsset.storageKey) : project.sourceImageUrl,
    resultImageUrl: project.resultStorageKey ? storagePublicUrl(project.resultStorageKey) : project.resultImageUrl,
  }));

  return (
    <PageShell maxWidth="lg" className="space-y-3 pb-32">
      <header className="flex items-center gap-3 px-1">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-wash text-accent-deep">
            <Archive aria-hidden={true} className="h-4.5 w-4.5" />
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
            const imageSrc = project.resultImageUrl?.trim() || project.sourceImageUrl?.trim() || fallback.src;
            const title = project.title?.trim() || "پروژه محصول";

            return (
              <article key={project.id} className="relative">
                <ImageFrame aspect="gallery" className="rounded-[var(--radius-lg)]">
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
                    </div>
                  </div>
                </ImageFrame>
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
                    <RefreshCw aria-hidden={true} className="h-3 w-3" />
                    بازگردانی
                  </button>
                </form>
              </article>
            );
          })}
        </section>
      )}
    </PageShell>
  );
}
