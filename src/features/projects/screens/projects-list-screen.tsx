"use client";

import Link from "next/link";
import { Check, Download, Edit3, Eye, Plus, RefreshCcw, Trash2, X } from "lucide-react";
import { useRef, useState } from "react";
import { ActionDock } from "@/components/ui/action-dock";
import { Button, ButtonLink } from "@/components/ui/button";
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
  createdAt: Date;
};

type ProjectsListScreenProps = {
  projects: ProjectListItem[];
};

const dateFormatter = new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "short" });

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
    <PageShell maxWidth="lg" className="space-y-5 pb-3">
      <div className="flex min-h-[calc(100svh-12rem)] flex-col gap-5">
        {projects.length === 0 ? (
          <section className="space-y-3">
            <div className="relative h-[218px] overflow-hidden rounded-[1.45rem] border border-white/80 bg-[#e7ded2]">
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
            </div>
            <p className="text-center text-sm text-muted">هنوز خروجی تولید نشده است.</p>
          </section>
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
                    <div
                      className={`relative h-[156px] overflow-hidden rounded-[1.08rem] border bg-[#ebe2d6] transition group-hover:border-border-strong ${
                        selected ? "border-[#c7a96b] shadow-[0_18px_36px_-28px_rgba(17,16,14,0.58)]" : "border-white/75"
                      } ${failed ? "grayscale-[35%] opacity-72" : ""}`}
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
                    <span className="absolute bottom-2 right-2 rounded-full bg-surface/84 px-2 py-0.5 text-[10px] font-medium text-muted backdrop-blur">
                      {dateFormatter.format(project.createdAt)}
                    </span>
                    {selected ? (
                      <span className="absolute left-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-surface">
                        <Check aria-hidden={true} className="h-4 w-4" />
                      </span>
                    ) : null}
                    {failed ? <span className="absolute inset-0 bg-white/18" aria-hidden={true} /> : null}
                    </div>
                  </Link>
                  {failed ? (
                    <Link
                      href={`/projects/${project.id}`}
                      aria-label="تلاش دوباره"
                      className="absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/75 bg-surface/92 text-[#8a5f23] shadow-[0_14px_28px_-22px_rgba(17,16,14,0.72)] backdrop-blur transition hover:bg-white"
                    >
                      <RefreshCcw aria-hidden={true} className="h-4 w-4" />
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
                        <RefreshCcw aria-hidden={true} className="h-3.5 w-3.5" />
                        نسخه جدید
                      </Link>
                      {project.resultImageUrl ? (
                        <a href={project.resultImageUrl} download className={contextMenuItemClasses}>
                          <Download aria-hidden={true} className="h-3.5 w-3.5" />
                          دانلود خروجی
                        </a>
                      ) : null}
                      <form action={renameProjectAction} className="space-y-1.5 px-1 py-1.5">
                        <input type="hidden" name="projectId" value={project.id} />
                        <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted">
                          <Edit3 aria-hidden={true} className="h-3.5 w-3.5" />
                          تغییر نام
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            name="title"
                            defaultValue={projectTitle}
                            maxLength={80}
                            className="min-w-0 flex-1 rounded-[0.65rem] border border-border bg-white px-2 py-1.5 text-xs outline-none focus:border-border-strong"
                          />
                          <button type="submit" className="rounded-[0.65rem] bg-foreground px-2.5 text-xs text-surface">
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
                          <Trash2 aria-hidden={true} className="h-3.5 w-3.5" />
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
                <button
                  type="submit"
                  aria-label="حذف"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#d92d20] text-white shadow-[0_12px_22px_-16px_rgba(217,45,32,0.9)] transition hover:bg-[#b42318] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
                >
                  <Trash2 aria-hidden={true} className="h-3.5 w-3.5" />
                </button>
              </form>
              <Button type="button" variant="secondary" className="h-12 w-full rounded-[1rem]" onClick={() => setSelectedIds([])}>
                <X aria-hidden={true} className="h-4 w-4" />
                لغو
              </Button>
            </>
          ) : (
            <ButtonLink href="/projects/new" size="full" className="h-12 rounded-[1rem]">
              <Plus aria-hidden={true} className="h-4 w-4" />
              پروژه جدید
            </ButtonLink>
          )}
        </ActionDock>
      </div>
    </PageShell>
  );
}
