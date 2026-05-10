"use client";

import Link from "next/link";
import { Add, CloseCircle, DocumentDownload, Edit2, Eye, Refresh, TickCircle, Trash } from "vuesax-icons-react";
import { useRef, useState } from "react";
import { ActionDock } from "@/components/ui/action-dock";
import { Button, ButtonLink, IconButton, buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { fieldControlClassName } from "@/components/ui/field";
import {
  contextMenuDangerItemClasses,
  contextMenuItemClasses,
  ItemContextMenu,
} from "@/components/ui/item-context-menu";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import { PageShell } from "@/components/ui/page-shell";
import { SafeJewelryImage } from "@/components/ui/safe-jewelry-image";
import { archiveProjectAction, renameProjectAction } from "@/features/projects/actions";
import { archiveItems, extras } from "@/lib/placeholders/jewelry-images";

const galleryFallbacks = [...archiveItems, ...extras];

export type ProjectListItem = {
  id: string;
  title: string | null;
  status: string;
  sourceAssetId: string | null;
  style: { name: string };
  resultImageUrl: string | null;
  sourceImageUrl: string | null;
  createdAt: Date;
};

type ProjectsListScreenProps = {
  projects: ProjectListItem[];
};

export function ProjectsListScreen({ projects }: ProjectsListScreenProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const longPressTimer = useRef<number | null>(null);
  const longPressTriggered = useRef(false);

  function toggleProject(projectId: string) {
    setSelectedIds((current) =>
      current.includes(projectId) ? current.filter((id) => id !== projectId) : [...current, projectId],
    );
  }

  function startProjectHold(projectId: string) {
    longPressTriggered.current = false;
    window.clearTimeout(longPressTimer.current ?? undefined);
    longPressTimer.current = window.setTimeout(() => {
      longPressTriggered.current = true;
      toggleProject(projectId);
    }, 420);
  }

  function cancelProjectHold() {
    window.clearTimeout(longPressTimer.current ?? undefined);
    longPressTimer.current = null;
  }

  return (
    <PageShell maxWidth="lg" className="space-y-5 pb-28">
      <div className="flex min-h-[calc(100svh-12rem)] flex-col gap-5">
        {projects.length === 0 ? (
          <EmptyState
            title="هنوز خروجی تولید نشده است."
            media={
              <SafeJewelryImage
                src={galleryFallbacks[0].src}
                fallbackSrc={galleryFallbacks[1].src}
                fallbackAlt={galleryFallbacks[0].alt}
                alt="نمونه خروجی پروژه"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 680px"
              />
            }
          />
        ) : (
          <section className="grid grid-cols-2 gap-3">
            {projects.map((project, index) => {
              const fallbackImage = galleryFallbacks[index % galleryFallbacks.length];
              const imageSrc = project.resultImageUrl?.trim() || project.sourceImageUrl?.trim() || fallbackImage.src;
              const projectTitle = project.title?.trim() || "پروژه محصول";
              const selected = selectedIds.includes(project.id);
              const failed = project.status === "FAILED";

              return (
                <article key={project.id} className="relative">
                  <Link
                    href={`/projects/${project.id}`}
                    onPointerDown={() => startProjectHold(project.id)}
                    onPointerLeave={cancelProjectHold}
                    onPointerCancel={cancelProjectHold}
                    onPointerUp={cancelProjectHold}
                    onClick={(event) => {
                      if (selectedIds.length > 0) {
                        event.preventDefault();
                        toggleProject(project.id);
                        return;
                      }

                      if (longPressTriggered.current) {
                        event.preventDefault();
                        longPressTriggered.current = false;
                      }
                    }}
                    className="group block w-full text-right"
                  >
                    <JewelryImageFrame aspect="landscape" selected={selected} disabled={failed} className="min-h-[126px] rounded-[var(--radius-lg)] group-hover:border-border-strong">
                    <SafeJewelryImage
                      src={imageSrc}
                      fallbackSrc={fallbackImage.src}
                      fallbackAlt={fallbackImage.alt}
                      alt={projectTitle}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 240px"
                    />
                    {selected ? (
                      <span className="absolute left-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-surface">
                        <TickCircle aria-hidden={true} className="h-4 w-4" />
                      </span>
                    ) : null}
                    {failed ? <span className="absolute inset-0 bg-white/18" aria-hidden={true} /> : null}
                    </JewelryImageFrame>
                  </Link>
                  {failed ? (
                    <Link
                      href={`/projects/${project.id}`}
                      aria-label="تلاش دوباره"
                      className={buttonClasses({ variant: "secondary", size: "icon", className: "absolute left-3 top-3 h-11 w-11 rounded-full bg-surface/92 text-accent-deep backdrop-blur" })}
                    >
                      <Refresh aria-hidden={true} className="h-4 w-4" />
                    </Link>
                  ) : null}
                  <div className="absolute bottom-2 left-2">
                    <ItemContextMenu label={`منوی ${projectTitle}`} align="right">
                      <Link href={`/projects/${project.id}`} className={contextMenuItemClasses}>
                        <Eye aria-hidden={true} className="h-3.5 w-3.5" />
                        مشاهده نتیجه
                      </Link>
                      <Link
                        href={project.sourceAssetId ? `/projects/new?assetId=${project.sourceAssetId}` : "/projects/new"}
                        className={contextMenuItemClasses}
                      >
                        <Refresh aria-hidden={true} className="h-3.5 w-3.5" />
                        نسخه جدید
                      </Link>
                      {project.resultImageUrl ? (
                        <a href={project.resultImageUrl} download className={contextMenuItemClasses}>
                          <DocumentDownload aria-hidden={true} className="h-3.5 w-3.5" />
                          دانلود خروجی
                        </a>
                      ) : null}
                      <form action={renameProjectAction} className="space-y-1.5 px-1 py-1.5">
                        <input type="hidden" name="projectId" value={project.id} />
                        <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted">
                          <Edit2 aria-hidden={true} className="h-3.5 w-3.5" />
                          تغییر نام
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            name="title"
                            defaultValue={projectTitle}
                            maxLength={80}
                            className={`${fieldControlClassName} min-h-9 flex-1 px-2 text-xs`}
                          />
                          <button type="submit" className={buttonClasses({ size: "sm", className: "min-h-9 rounded-[var(--radius-sm)] px-2.5 text-xs" })}>
                            ثبت
                          </button>
                        </div>
                      </form>
                      <form
                        action={archiveProjectAction}
                        onSubmit={(event) => {
                          if (!window.confirm("این پروژه به آرشیو می‌رود و بعد از ۱۴ روز حذف کامل می‌شود. ادامه می‌دهید؟")) {
                            event.preventDefault();
                          }
                        }}
                      >
                        <input type="hidden" name="projectId" value={project.id} />
                        <button type="submit" className={contextMenuDangerItemClasses}>
                          <Trash aria-hidden={true} className="h-3.5 w-3.5" />
                          حذف
                        </button>
                      </form>
                    </ItemContextMenu>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <ActionDock sticky className={selectedIds.length > 0 ? "!grid-cols-[2.25rem_minmax(0,1fr)] items-center" : ""}>
          {selectedIds.length > 0 ? (
            <>
              <form
                action={archiveProjectAction}
                onSubmit={(event) => {
                  if (!window.confirm("پروژه‌های انتخاب‌شده به آرشیو می‌روند و بعد از ۱۴ روز حذف کامل می‌شوند. ادامه می‌دهید؟")) {
                    event.preventDefault();
                  }
                }}
              >
                {selectedIds.map((id) => (
                  <input key={id} type="hidden" name="projectId" value={id} />
                ))}
                <IconButton type="submit" label="حذف" variant="danger" className="h-11 w-11">
                  <Trash aria-hidden={true} className="h-4 w-4" />
                </IconButton>
              </form>
              <Button type="button" variant="secondary" className="h-12 w-full rounded-[1rem]" onClick={() => setSelectedIds([])}>
                <CloseCircle aria-hidden={true} className="h-4 w-4" />
                لغو
              </Button>
            </>
          ) : (
            <ButtonLink href="/projects/new" size="full" className="h-12 rounded-[1rem]">
              <Add aria-hidden={true} className="h-4 w-4" />
              پروژه جدید
            </ButtonLink>
          )}
        </ActionDock>
      </div>
    </PageShell>
  );
}
