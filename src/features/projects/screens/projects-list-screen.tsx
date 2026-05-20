"use client";

import Link from "next/link";
import { CloseCircle, DocumentDownload, Edit2, Eye, Refresh, TickCircle, Trash } from "vuesax-icons-react";
import { useRef, useState } from "react";
import { ActionDock } from "@/components/ui/action-dock";
import { Button, IconButton, buttonClasses } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { EmptyState } from "@/components/ui/empty-state";
import { fieldControlClassName } from "@/components/ui/field";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import {
  contextMenuDangerItemClasses,
  contextMenuItemClasses,
  ItemContextMenu,
} from "@/components/ui/item-context-menu";
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
  createdAt: Date | string;
};

type ProjectsListScreenProps = {
  projects: ProjectListItem[];
};

export function ProjectsListScreen({ projects }: ProjectsListScreenProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
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
    <PageShell maxWidth="lg" className="space-y-5 pb-32">
      <div className="flex min-h-[calc(100svh-12rem)] flex-col gap-5">
        {projects.length === 0 ? (
          <EmptyState
            title="هنوز خروجی تولید نشده است."
            media={(
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
            )}
          />
        ) : (
          <section className="grid grid-cols-2 gap-3">
            {projects.map((project, index) => {
              const fallbackImage = galleryFallbacks[index % galleryFallbacks.length];
              const imageSrc = project.resultImageUrl?.trim() || project.sourceImageUrl?.trim() || fallbackImage.src;
              const projectTitle = project.title?.trim() || "پروژه محصول";
              const selected = selectedIds.includes(project.id);
              const failed = project.status === "FAILED";
              const editing = editingProjectId === project.id;

              return (
                <article key={project.id} className="relative">
                  <div className="relative">
                    <JewelryImageFrame
                      aspect="gallery"
                      selected={selected}
                      className="rounded-[var(--radius-lg)]"
                    >
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
                        className="group absolute inset-0 z-0 block text-right"
                        aria-label={`مشاهده ${projectTitle}`}
                      >
                        <SafeJewelryImage
                          src={imageSrc}
                          fallbackSrc={fallbackImage.src}
                          fallbackAlt={fallbackImage.alt}
                          alt={projectTitle}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 240px"
                        />
                      </Link>
                      {selected ? (
                          <span className="motion-reveal-soft absolute right-2.5 top-2.5 z-20 inline-flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-surface">
                          <TickCircle aria-hidden={true} className="h-4 w-4" />
                        </span>
                      ) : null}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/58 via-black/18 via-34% to-transparent px-3 pb-2.5 pt-5">
                        <div
                          className="absolute inset-x-0 bottom-0 z-0 h-12 bg-black/10 backdrop-blur-[1.5px] [mask-image:linear-gradient(to_top,black_0%,rgba(0,0,0,0.62)_34%,transparent_100%)]"
                          aria-hidden={true}
                        />
                        {editing ? (
                          <form
                            action={renameProjectAction}
                            className="pointer-events-auto relative z-20 grid grid-cols-[minmax(0,1fr)_1.25rem_1.25rem] items-center gap-1.5"
                            onSubmit={() => setEditingProjectId(null)}
                          >
                            <input type="hidden" name="projectId" value={project.id} />
                            <input
                              name="title"
                              defaultValue={projectTitle}
                              maxLength={80}
                              autoFocus
                              onKeyDown={(event) => {
                                if (event.key === "Escape") {
                                  event.preventDefault();
                                  setEditingProjectId(null);
                                }
                              }}
                              className="min-h-6 min-w-0 border-0 bg-transparent p-0 text-right text-xs font-semibold text-white caret-accent-bright outline-none placeholder:text-white/45 drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]"
                            />
                            <button
                              type="submit"
                              aria-label="تایید نام پروژه"
                              className="motion-press inline-flex h-5 w-5 items-center justify-center rounded-full text-accent-bright"
                            >
                              <TickCircle aria-hidden={true} className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingProjectId(null)}
                              aria-label="انصراف از ویرایش نام پروژه"
                              className="motion-press inline-flex h-5 w-5 items-center justify-center rounded-full text-surface/72"
                            >
                              <CloseCircle aria-hidden={true} className="h-4 w-4" />
                            </button>
                          </form>
                        ) : (
                          <div className="relative z-20 grid grid-cols-[minmax(0,1fr)_2rem] items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingProjectId(project.id)}
                              className="pointer-events-auto flex min-h-8 min-w-0 items-center truncate text-right text-xs font-semibold text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]"
                              aria-label="ویرایش نام پروژه"
                            >
                              {projectTitle}
                            </button>
                            <div className="pointer-events-auto flex justify-start">
                              <ItemContextMenu label={`منوی ${projectTitle}`} align="right" size="sm">
                                <Link href={`/projects/${project.id}`} className={contextMenuItemClasses}>
                                  <Eye aria-hidden={true} className="h-3.5 w-3.5" />
                                  مشاهده نتیجه
                                </Link>
                                {project.resultImageUrl ? (
                                  <a href={project.resultImageUrl} download className={contextMenuItemClasses}>
                                    <DocumentDownload aria-hidden={true} className="h-3.5 w-3.5" />
                                    دانلود خروجی
                                  </a>
                                ) : null}
                                <Link
                                  href={project.sourceAssetId ? `/projects/new?assetId=${project.sourceAssetId}` : "/projects/new"}
                                  className={contextMenuItemClasses}
                                >
                                  <Refresh aria-hidden={true} className="h-3.5 w-3.5" />
                                  نسخه جدید
                                </Link>
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
                                <ConfirmAction
                                  action={archiveProjectAction}
                                  fields={[{ name: "projectId", value: project.id }]}
                                  title="انتقال پروژه به آرشیو"
                                  description="این پروژه از لیست پروژه‌ها خارج می‌شود و در آرشیو حساب قابل مشاهده و بازیابی خواهد بود."
                                  confirmLabel="انتقال به آرشیو"
                                  trigger={(open) => (
                                    <button type="button" onClick={open} className={contextMenuDangerItemClasses}>
                                      <Trash aria-hidden={true} className="h-3.5 w-3.5" />
                                      حذف
                                    </button>
                                  )}
                                />
                              </ItemContextMenu>
                            </div>
                          </div>
                        )}
                      </div>
                      {failed ? <span className="pointer-events-none absolute inset-0 z-[1] bg-black/42" aria-hidden={true} /> : null}
                    </JewelryImageFrame>

                    {failed ? (
                      <Link
                        href={`/projects/${project.id}`}
                        aria-label="تلاش دوباره"
                        className={buttonClasses({
                          variant: "secondary",
                          size: "icon",
                          className: "absolute left-3 top-3 z-20 h-6 w-6 rounded-full bg-surface/82 p-0 text-accent-deep backdrop-blur shadow-[0_10px_20px_-16px_rgba(17,16,14,0.75)]",
                        })}
                      >
                        <Refresh aria-hidden={true} className="h-3.5 w-3.5" />
                      </Link>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {selectedIds.length > 0 ? (
          <ActionDock sticky className="!grid-cols-[2.25rem_minmax(0,1fr)] items-center">
            <>
              <ConfirmAction
                action={archiveProjectAction}
                fields={selectedIds.map((id) => ({ name: "projectId", value: id }))}
                title="انتقال پروژه‌ها به آرشیو"
                description="پروژه‌های انتخاب‌شده از لیست پروژه‌ها خارج می‌شوند و در آرشیو حساب قابل مشاهده و بازیابی خواهند بود."
                confirmLabel="انتقال به آرشیو"
                trigger={(open) => (
                  <IconButton type="button" onClick={open} label="حذف" variant="danger" className="h-11 w-11">
                    <Trash aria-hidden={true} className="h-4 w-4" />
                  </IconButton>
                )}
              />
              <Button type="button" variant="secondary" className="h-12 w-full rounded-[1rem]" onClick={() => setSelectedIds([])}>
                <CloseCircle aria-hidden={true} className="h-4 w-4" />
                لغو
              </Button>
            </>
          </ActionDock>
        ) : null}
      </div>
    </PageShell>
  );
}
