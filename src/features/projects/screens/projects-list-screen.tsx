"use client";

import Link from "next/link";
import {
  XCircle,
  Download,
  Pencil,
  Eye,
  ImagePlus,
  RefreshCw,
  CheckCircle,
  Trash2,
  Sparkles,
  X,
  Inbox,
} from "lucide-react";
import { useRef, useState } from "react";
import { Button, IconButton, buttonClasses } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { EmptyState } from "@/components/ui/empty-state";
import { fieldControlClassName } from "@/components/ui/field";
import { ImageFrame } from "@/components/ui/image-frame";
import {
  ContextMenuItem,
  ContextMenuSeparator,
  ItemContextMenu,
} from "@/components/ui/item-context-menu";
import { PageShell } from "@/components/ui/page-shell";
import { SafeJewelryImage } from "@/components/ui/safe-jewelry-image";
import { Pill } from "@/components/ui/pill";
import { archiveProjectAction, renameProjectAction, saveProjectResultAsStyleReferenceAction } from "@/features/projects/actions";
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

const STATUS_TONE: Record<string, { tone: "neutral" | "success" | "danger" | "champagne" | "info"; label: string }> = {
  COMPLETED: { tone: "success", label: "آماده" },
  QUEUED: { tone: "info", label: "در صف" },
  PROCESSING: { tone: "champagne", label: "در حال ساخت" },
  FAILED: { tone: "danger", label: "ناموفق" },
};

function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "short" }).format(date);
}

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
    <PageShell maxWidth="phone" className="space-y-4 pb-[8.5rem]">
      {projects.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-6 w-6" strokeWidth={1.8} />}
          title="هنوز پروژه‌ای نساختی"
          description="برای اولین خروجی، یک عکس از گالری انتخاب کن یا تازه شروع کن."
          action={
            <Link
              href="/projects/new"
              className={buttonClasses({ variant: "champagne", size: "lg", className: "w-full" })}
            >
              <Sparkles aria-hidden className="h-4 w-4" strokeWidth={2.2} />
              ساخت اولین پروژه
            </Link>
          }
          className="py-12"
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
            const statusInfo = STATUS_TONE[project.status] ?? { tone: "neutral" as const, label: project.status };

            return (
              <article key={project.id} className="relative">
                <ImageFrame
                  aspect="gallery"
                  tone="photo"
                  selected={selected}
                  radius="lg"
                  className="border-0"
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
                      className="object-cover transition-transform duration-[var(--d-slow)] group-hover:scale-[1.02]"
                      sizes="(max-width: 768px) 50vw, 240px"
                    />
                  </Link>

                  <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2">
                    <Pill tone={statusInfo.tone} size="xs">
                      {statusInfo.label}
                    </Pill>
                    {selected ? (
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--r-pill)] bg-ink-1 text-surface shadow-[var(--shadow-md)]">
                        <CheckCircle aria-hidden className="h-4 w-4" strokeWidth={2.2} />
                      </span>
                    ) : null}
                  </div>

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-1/68 to-transparent p-2.5 pt-6">
                    {editing ? (
                      <form
                        action={renameProjectAction}
                        className="pointer-events-auto flex items-center gap-1.5"
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
                          className="min-h-7 min-w-0 flex-1 rounded-[var(--r-sm)] border border-white/30 bg-ink-1/40 px-2 text-[12px] font-semibold text-surface outline-none placeholder:text-white/45"
                        />
                        <button
                          type="submit"
                          aria-label="تایید نام پروژه"
                          className="ov-press inline-flex h-7 w-7 items-center justify-center rounded-[var(--r-pill)] text-surface"
                        >
                          <CheckCircle aria-hidden className="h-4 w-4" strokeWidth={2.2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingProjectId(null)}
                          aria-label="انصراف از ویرایش نام پروژه"
                          className="ov-press inline-flex h-7 w-7 items-center justify-center rounded-[var(--r-pill)] text-surface/72"
                        >
                          <XCircle aria-hidden className="h-4 w-4" strokeWidth={2.2} />
                        </button>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingProjectId(project.id)}
                          className="pointer-events-auto min-w-0 truncate text-right text-[12px] font-semibold text-surface"
                          aria-label="ویرایش نام پروژه"
                        >
                          {projectTitle}
                        </button>
                        <span className="shrink-0 text-[10px] text-surface/72">{formatDate(project.createdAt)}</span>
                      </div>
                    )}
                  </div>
                  {failed ? <span className="pointer-events-none absolute inset-0 z-[1] bg-ink-1/40" aria-hidden /> : null}
                </ImageFrame>

                <div className="absolute bottom-2 left-2">
                  <ItemContextMenu label={`منوی ${projectTitle}`} align="end" size="sm">
                    <ContextMenuItem>
                      <Link href={`/projects/${project.id}`} className="flex w-full items-center gap-2">
                        <Eye aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
                        مشاهده نتیجه
                      </Link>
                    </ContextMenuItem>
                    {project.resultImageUrl ? (
                      <ContextMenuItem>
                        <a href={project.resultImageUrl} download className="flex w-full items-center gap-2">
                          <Download aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
                          دانلود خروجی
                        </a>
                      </ContextMenuItem>
                    ) : null}
                    {project.resultImageUrl ? (
                      <form action={saveProjectResultAsStyleReferenceAction}>
                        <input type="hidden" name="projectId" value={project.id} />
                        <ContextMenuItem>
                          <span className="flex w-full items-center gap-2">
                            <ImagePlus aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
                            ذخیره در نمونه‌ها
                          </span>
                        </ContextMenuItem>
                      </form>
                    ) : null}
                    <ContextMenuItem>
                      <Link
                        href={project.sourceAssetId ? `/projects/new?assetId=${project.sourceAssetId}` : "/projects/new"}
                        className="flex w-full items-center gap-2"
                      >
                        <RefreshCw aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
                        نسخه جدید
                      </Link>
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <form action={renameProjectAction} className="space-y-1.5 p-1.5">
                      <input type="hidden" name="projectId" value={project.id} />
                      <label className="flex items-center gap-1.5 text-[11px] font-medium text-ink-3">
                        <Pencil aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
                        تغییر نام
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          name="title"
                          defaultValue={projectTitle}
                          maxLength={80}
                          className={`${fieldControlClassName} h-9 flex-1 px-2 text-xs`}
                        />
                        <button type="submit" className={buttonClasses({ size: "sm", className: "h-9 rounded-[var(--r-sm)] px-2.5 text-xs" })}>
                          ثبت
                        </button>
                      </div>
                    </form>
                    <ContextMenuSeparator />
                    <ConfirmAction
                      action={archiveProjectAction}
                      fields={[{ name: "projectId", value: project.id }]}
                      title="آیا از انتقال پروژه به آرشیو مطمئنید؟"
                      confirmLabel="انتقال به آرشیو"
                      trigger={
                        <button type="button" className="flex w-full items-center gap-2 rounded-[var(--r-sm)] px-3 py-2 text-[13px] font-semibold text-danger hover:bg-danger-soft">
                          <Trash2 aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
                          حذف
                        </button>
                      }
                    />
                  </ItemContextMenu>
                </div>

                {failed ? (
                  <Link
                    href={`/projects/${project.id}`}
                    aria-label="تلاش دوباره"
                    className={buttonClasses({
                      variant: "secondary",
                      size: "icon",
                      className: "absolute right-2 top-2 z-20 h-7 w-7 rounded-full bg-surface/90 p-0 text-ink-1 backdrop-blur shadow-[var(--shadow-xs)]",
                    })}
                  >
                    <RefreshCw aria-hidden className="h-3.5 w-3.5" strokeWidth={2.2} />
                  </Link>
                ) : null}
              </article>
            );
          })}
        </section>
      )}

      {selectedIds.length > 0 ? (
        <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.85rem)] z-30 mx-auto w-full max-w-[420px] px-[var(--page-x)]">
          <div className="flex items-center gap-2 rounded-[var(--r-xl)] border border-border-hairline bg-surface/95 p-2 shadow-[var(--shadow-lg)] backdrop-blur-xl">
            <ConfirmAction
              action={archiveProjectAction}
              fields={selectedIds.map((id) => ({ name: "projectId", value: id }))}
              title="آیا از انتقال پروژه‌ها به آرشیو مطمئنید؟"
              confirmLabel="انتقال به آرشیو"
              trigger={
                <IconButton label="حذف" variant="danger" className="h-12 w-12 rounded-[var(--r-lg)]">
                  <Trash2 aria-hidden className="h-4 w-4" strokeWidth={2.2} />
                </IconButton>
              }
            />
            <Button type="button" variant="secondary" className="h-12 flex-1 rounded-[var(--r-lg)]" onClick={() => setSelectedIds([])}>
              <X aria-hidden className="h-4 w-4" strokeWidth={2.2} />
              لغو
            </Button>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
