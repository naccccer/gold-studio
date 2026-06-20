"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Add,
  ArrowDown2,
  CloseCircle,
  Copy,
  ExportCurve,
  Gallery,
  GalleryAdd,
  Maximize4,
  Refresh,
  Scan,
  TickCircle,
  Trash,
} from "vuesax-icons-react";
import { ActionDock } from "@/components/ui/action-dock";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { fieldControlClassName } from "@/components/ui/field";
import {
  contextMenuDangerItemClasses,
  contextMenuItemClasses,
  ItemContextMenu,
} from "@/components/ui/item-context-menu";
import { JewelryImageFrame } from "@/components/ui/jewelry-image-frame";
import { PageShell } from "@/components/ui/page-shell";
import { ProcessingCanvas } from "@/components/ui/processing-canvas";
import { SafeJewelryImage } from "@/components/ui/safe-jewelry-image";
import {
  archiveProjectAction,
  renameProjectAction,
  retryProjectAction,
  saveProjectResultAsStyleReferenceAction,
} from "@/features/projects/actions";
import { ProjectStatusRefresh } from "@/features/projects/components/project-status-refresh";
import { resultHeroDark, uploadPreview } from "@/lib/placeholders/jewelry-images";
import { generateNumericSupportCode } from "@/lib/support-code";

const statusConfig: Record<string, { label: string; supportCopy: string }> = {
  QUEUED: {
    label: "در صف",
    supportCopy: "پروژه ثبت شده و به زودی وارد پردازش می‌شود.",
  },
  PROCESSING: {
    label: "در حال تولید",
    supportCopy: "خروجی در حال آماده‌سازی است.",
  },
  COMPLETED: {
    label: "آماده",
    supportCopy: "خروجی نهایی آماده دانلود است.",
  },
  FAILED: {
    label: "ناموفق",
    supportCopy: "تولید کامل نشد. دوباره تلاش کنید.",
  },
};

function formatProjectError(project: ProjectDetail) {
  if (project.resultImageError) {
    return {
      title: "خروجی ساخته شده، اما فایل تصویر قابل نمایش نیست",
      description: project.resultImageError,
      supportCode: generateNumericSupportCode(project.id),
    };
  }

  const raw = project.errorMessage?.trim() ?? "";
  const supportCode = generateNumericSupportCode(project.id);
  const normalized = raw.toLowerCase();

  if (!raw) {
    return {
      title: "پروژه کامل نشد",
      description: "پردازش این خروجی کامل نشد. دوباره تلاش کنید و اگر تکرار شد، کد پیگیری را برای پشتیبانی بفرستید.",
      supportCode,
    };
  }

  if (normalized.includes("insufficient balance")) {
    return {
      title: "اعتبار سرویس تولید کافی نیست",
      description: "اعتبار پنل Liara برای ساخت این تصویر کافی نیست. شارژ سرویس تولید تصویر را بررسی کنید.",
      supportCode,
    };
  }

  if (normalized.includes("timeout") || normalized.includes("timed out")) {
    return {
      title: "زمان پردازش بیشتر از حد معمول شد",
      description: "ساخت این خروجی بیشتر از زمان انتظار طول کشید. چند دقیقه دیگر دوباره امتحان کنید.",
      supportCode,
    };
  }

  if (normalized.includes("network") || normalized.includes("fetch") || raw.includes("اتصال به سرویس تولید")) {
    return {
      title: "ارتباط با سرویس تولید کامل نشد",
      description: "ارتباط سرور با Liara کامل نشد. اگر روی لوکال هستید، اتصال اینترنت یا پراکسی Liara را بررسی کنید و دوباره تلاش کنید.",
      supportCode,
    };
  }

  if (normalized.includes("liara") || normalized.includes("provider") || normalized.includes("status 400")) {
    return {
      title: "سرویس تولید تصویر پاسخ کامل نداد",
      description: "درخواست به Liara رسید، اما provider آن را کامل نکرد. مدل، سایز خروجی، اعتبار Liara و دسترسی شبکه را بررسی کنید.",
      supportCode,
    };
  }

  return {
    title: "پروژه کامل نشد",
    description: raw || "تولید تصویر کامل نشد. دوباره تلاش کنید و اگر تکرار شد، کد پیگیری را برای پشتیبانی ارسال کنید.",
    supportCode,
  };
}

function buildProcessingMoments(styleName: string) {
  const withModel = styleName.includes("مدل");
  const phaseZero = [
    "تشخیص محصول",
    "بررسی جزئیات",
    "چک کردن زاویه",
    "هماهنگی با عکاس",
  ];
  const phaseOne = [
    withModel ? "در حال هماهنگ کردن با مدل" : "پاک‌سازی زمینه",
    "تنظیم نور",
    "مرتب‌کاری لبه‌ها",
  ];
  const phaseTwo = [
    "چیدمان قاب",
    "صیقل نهایی",
    "آماده‌سازی خروجی",
    "لمس آخر",
  ];

  const phases = [phaseZero, phaseOne, phaseTwo] as const;
  const totalRows = Math.max(...phases.map((steps) => steps.length));

  return Array.from({ length: totalRows }).flatMap((_, index) =>
    phases.flatMap((steps, phase) => {
      const step = steps[index];

      return step ? [{ step, phase }] : [];
    }),
  );
}

function stripVersionSuffix(title: string) {
  return title.replace(/\s*[-–]\s*نسخه\s+(?:دیگر|[0-9۰-۹٠-٩]+)\s*$/u, "").trim();
}

function extractStyleSettings(prompt?: string | null) {
  if (!prompt) return [];

  const settings: string[] = [];
  const exactMatches: Array<[string, string]> = [
    ["Background type: use a simple seamless", "نوع: ساده"],
    ["Background type: use refined matte fabric", "نوع: پارچه"],
    ["Background type: use premium fine-grain leather", "نوع: چرم"],
    ["Background type: use a clean matte stone", "نوع: سنگ"],
    ["Background type: use smooth premium paper", "نوع: کاغذ استودیویی"],
    ["Background color: clean soft white", "رنگ: سفید نرم"],
    ["Background color: warm milk-white ivory", "رنگ: شیری"],
    ["Background color: pale champagne cream", "رنگ: کرم شامپاینی"],
    ["Background color: very light neutral gray", "رنگ: طوسی روشن"],
    ["Background color: soft warm sand beige", "رنگ: شنی روشن"],
    ["Background color: very pale blush nude", "رنگ: رز ملایم"],
    ["Background color: muted pale sage", "رنگ: سبز سیج"],
    ["Background color: deep refined navy", "رنگ: سرمه‌ای"],
    ["Background color: deep charcoal", "رنگ: ذغالی"],
    ["Use an elegant adult woman model", "مدل: زن"],
    ["Use an elegant adult man model", "مدل: مرد"],
    ["Decor surface: use a restrained matte stone", "سطح: سنگی"],
    ["Decor surface: use simple geometric blocks", "سطح: هندسی"],
    ["Decor surface: use a matte fabric surface", "سطح: پارچه مات"],
    ["Editorial mood: calm", "حال‌وهوا: آرام"],
    ["Editorial mood: more luxurious", "حال‌وهوا: لوکس"],
    ["Editorial mood: slightly bolder", "حال‌وهوا: جسور"],
    ["Social background tone: use a light tonal", "پس‌زمینه: روشن"],
    ["Social background tone: use a dark tonal", "پس‌زمینه: تیره"],
    ["Social text placement: reserve the right side", "جای متن: راست"],
    ["Social text placement: reserve the left side", "جای متن: چپ"],
    ["Social text placement: reserve the upper area", "جای متن: بالا"],
    ["Social text placement: reserve the lower area", "جای متن: پایین"],
  ];

  for (const [needle, label] of exactMatches) {
    if (prompt.includes(needle)) {
      settings.push(label);
    }
  }

  const levelLabels: Record<string, string> = {
    low: "کم",
    moderate: "متوسط",
    high: "زیاد",
  };
  const rangeMatches: Array<[RegExp, string]> = [
    [/Soft shadow strength: (low|moderate|high)/, "سایه"],
    [/Decor intensity: (low|moderate|high)/, "شدت دکور"],
    [/Depth of field: (low|moderate|high)/, "عمق میدان"],
    [/Contrast intensity: (low|moderate|high)/, "کنتراست"],
  ];

  for (const [pattern, label] of rangeMatches) {
    const match = prompt.match(pattern);
    if (match?.[1]) {
      settings.push(`${label}: ${levelLabels[match[1]] ?? match[1]}`);
    }
  }

  return settings;
}

export type ProjectDetail = {
  id: string;
  title: string | null;
  sourceAssetId: string | null;
  sourceImageUrl: string;
  resultImageUrl: string | null;
  status: string;
  outputPreset: string;
  productType: string | null;
  style: { name: string };
  prompt?: string | null;
  errorMessage: string | null;
  freeVariantUsedAt?: Date | string | null;
  freeVariantProjectId?: string | null;
  variantParentId?: string | null;
  resultImageError?: string | null;
  createdAt?: Date | string;
  titleRefreshPending?: boolean;
  variantNumber?: number | null;
  freeVariantRemaining?: number | null;
};

const failedCreditReassurance =
  "اگر پردازش این پروژه کامل نشود، اعتباری از حساب شما کسر نخواهد شد.";

type ShareStatus = "idle" | "sharing" | "shared" | "copied" | "failed";
type ReferenceSaveStatus = "idle" | "saving" | "saved" | "failed";

type ProjectDetailScreenProps = { project: ProjectDetail };

function shareFileExtension(mimeType: string) {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  return "jpg";
}

function shareFileName(projectId: string, mimeType: string) {
  return `ovala-${projectId.slice(0, 8)}.${shareFileExtension(mimeType)}`;
}

function DetailMeta({
  projectId,
  title,
  variantLabel,
  styleName,
  styleSettings,
}: {
  projectId: string;
  title: string;
  variantLabel?: string | null;
  styleName: string;
  styleSettings: string[];
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [styleDetailsOpen, setStyleDetailsOpen] = useState(false);
  const hasStyleSettings = styleSettings.length > 0;

  return (
    <div className="shrink-0 space-y-2 rounded-[1.15rem] border border-white/12 bg-white/[0.05] px-3.5 py-3 text-right">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {editingTitle ? (
            <form
              action={renameProjectAction}
              className="flex items-center gap-1.5"
              onSubmit={() => {
                setEditingTitle(false);
              }}
            >
              <input type="hidden" name="projectId" value={projectId} />
              <input
                name="title"
                defaultValue={title}
                maxLength={80}
                autoFocus
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    setEditingTitle(false);
                  }
                }}
                className={`${fieldControlClassName} min-h-8 flex-1 border-white/10 bg-white/[0.06] px-2.5 text-xs text-surface shadow-none placeholder:text-surface/40 focus-visible:shadow-none`}
              />
              <button
                type="submit"
                aria-label="تایید نام پروژه"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent-soft bg-accent-wash/92 text-accent-deep transition hover:bg-accent-wash"
              >
                <TickCircle aria-hidden={true} className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setEditingTitle(false)}
                aria-label="انصراف از ویرایش نام پروژه"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-surface/72 transition hover:bg-white/[0.12]"
              >
                <CloseCircle aria-hidden={true} className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditingTitle(true)}
                className="min-w-0 truncate text-right text-sm font-semibold text-surface transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft"
                aria-label="ویرایش نام پروژه"
              >
                {title}
              </button>
              {variantLabel ? (
                <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.07] px-2 py-0.5 text-sm font-semibold leading-5 text-surface">
                  {variantLabel}
                </span>
              ) : null}
            </div>
          )}
        </div>
        <div className="relative mt-0.5 max-w-[42%] shrink-0">
          <button
            type="button"
            onClick={() => setStyleDetailsOpen((current) => !current)}
            className="inline-flex w-full items-center rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold leading-5 text-surface/76 transition hover:bg-white/[0.1]"
            aria-expanded={styleDetailsOpen}
            aria-label="نمایش تنظیمات سبک"
          >
            <span className="truncate">{styleName}</span>
          </button>
          {styleDetailsOpen ? (
            <div className="absolute left-0 top-[calc(100%+0.35rem)] z-30 w-44 rounded-[0.9rem] border border-white/12 bg-[#171411] p-2 text-right shadow-[0_20px_44px_-28px_rgba(0,0,0,0.9)]">
              <div className="flex flex-wrap gap-1.5">
                {(hasStyleSettings ? styleSettings : ["تنظیمات خاصی ثبت نشده"]).map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-1 text-[10px] leading-4 text-surface/76">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ResultHeader({
  projectId,
  title,
  variantLabel,
  styleName,
  styleSettings,
}: {
  projectId: string;
  title: string;
  variantLabel?: string | null;
  styleName: string;
  styleSettings: string[];
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [styleDetailsOpen, setStyleDetailsOpen] = useState(false);
  const hasStyleSettings = styleSettings.length > 0;

  return (
    <header className="shrink-0 px-0.5 text-right">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          {editingTitle ? (
            <form
              action={renameProjectAction}
              className="flex items-center gap-1.5"
              onSubmit={() => {
                setEditingTitle(false);
              }}
            >
              <input type="hidden" name="projectId" value={projectId} />
              <input
                name="title"
                defaultValue={title}
                maxLength={80}
                autoFocus
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    setEditingTitle(false);
                  }
                }}
                className={`${fieldControlClassName} min-h-9 flex-1 border-white/10 bg-white/[0.07] px-3 text-sm text-surface shadow-none placeholder:text-surface/40 focus-visible:shadow-none`}
              />
              <button
                type="submit"
                aria-label="تایید نام پروژه"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-wash text-accent-deep transition hover:bg-accent-soft"
              >
                <TickCircle aria-hidden={true} className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setEditingTitle(false)}
                aria-label="انصراف از ویرایش نام پروژه"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-surface/72 transition hover:bg-white/[0.12]"
              >
                <CloseCircle aria-hidden={true} className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setEditingTitle(true)}
                className="min-w-0 truncate text-right text-base font-semibold leading-7 text-surface transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft"
                aria-label="ویرایش نام پروژه"
              >
                {title}
              </button>
              {variantLabel ? (
                <span className="shrink-0 rounded-full bg-white/[0.08] px-2 py-0.5 text-xs font-semibold leading-5 text-surface/84">
                  {variantLabel}
                </span>
              ) : null}
            </div>
          )}
        </div>

        <div className="relative max-w-[38%] shrink-0">
          <button
            type="button"
            onClick={() => setStyleDetailsOpen((current) => !current)}
            className="inline-flex h-8 w-full items-center justify-center rounded-full bg-white/[0.08] px-3 text-[11px] font-semibold leading-none text-surface/78 transition hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft"
            aria-expanded={styleDetailsOpen}
            aria-label="نمایش تنظیمات سبک"
          >
            <span className="truncate">{styleName}</span>
          </button>
          {styleDetailsOpen ? (
            <div className="absolute left-0 top-[calc(100%+0.45rem)] z-30 w-52 rounded-[1rem] border border-white/12 bg-[#171411] p-2.5 text-right shadow-[0_20px_44px_-28px_rgba(0,0,0,0.9)]">
              <div className="flex flex-wrap gap-1.5">
                {(hasStyleSettings ? styleSettings : ["تنظیمات خاصی ثبت نشده"]).map((item) => (
                  <span key={item} className="rounded-full bg-white/[0.07] px-2 py-1 text-[10px] leading-4 text-surface/76">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export function ProjectDetailScreen({ project }: ProjectDetailScreenProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const [showBefore, setShowBefore] = useState(false);
  const [copiedError, setCopiedError] = useState(false);
  const [shareStatus, setShareStatus] = useState<ShareStatus>("idle");
  const [referenceSaveStatus, setReferenceSaveStatus] = useState<ReferenceSaveStatus>("idle");
  const [resultImageLoadFailed, setResultImageLoadFailed] = useState(false);
  const status = statusConfig[project.status] ?? {
    label: "ثبت شده",
    supportCopy: "وضعیت پروژه ثبت شد.",
  };
  const hasResult = Boolean(project.resultImageUrl);
  const resultImageError =
    project.resultImageError ??
    (resultImageLoadFailed && project.resultImageUrl
      ? `فایل خروجی از این آدرس در مرورگر لود نشد: ${project.resultImageUrl}`
      : null);
  const visibleProject = resultImageError ? { ...project, resultImageError } : project;
  const isActive = project.status === "QUEUED" || project.status === "PROCESSING";
  const resultImageSrc = project.resultImageUrl || resultHeroDark.src;
  const sourceImageSrc = project.sourceImageUrl || uploadPreview.src;
  const newVersionHref = project.sourceAssetId ? `/projects/new?assetId=${project.sourceAssetId}&step=size` : "/projects/new";
  const freeVariantHref = project.sourceAssetId
    ? `/projects/new?assetId=${project.sourceAssetId}&freeVariantParentId=${project.id}&step=size`
    : "/projects/new";
  const canCreateFreeVariant =
    project.status === "COMPLETED" &&
    Boolean(project.sourceAssetId) &&
    !project.variantParentId &&
    !project.freeVariantProjectId &&
    (project.freeVariantRemaining ?? 0) > 0;
  const processingMoments = buildProcessingMoments(project.style.name);
  const errorPresentation = formatProjectError(visibleProject);
  const errorCopyText = [
    errorPresentation.title,
    errorPresentation.description,
    failedCreditReassurance,
    `کد پیگیری: ${errorPresentation.supportCode}`,
  ].join("\n");
  const rawProjectTitle = project.title?.trim() || "پروژه محصول";
  const projectTitle = stripVersionSuffix(rawProjectTitle) || rawProjectTitle;
  const variantLabel = project.variantNumber && project.variantNumber > 1
    ? project.variantNumber.toLocaleString("fa-IR")
    : null;
  const styleSettings = extractStyleSettings(project.prompt);
  const titleRefreshPending = Boolean(project.titleRefreshPending);
  const closeFullscreen = useCallback(() => {
    setFullscreen(false);
  }, []);

  async function handleCopyError() {
    try {
      await navigator.clipboard.writeText(errorCopyText);
      setCopiedError(true);
      window.setTimeout(() => setCopiedError(false), 1600);
    } catch {
      setCopiedError(false);
    }
  }

  async function shareResultUrl(url: string) {
    const absoluteUrl = new URL(url, window.location.href).toString();
    const shareData = {
      title: projectTitle,
      text: "خروجی آماده‌شده در اوالا",
      url: absoluteUrl,
    };

    if (navigator.share) {
      await navigator.share(shareData);
      setShareStatus("shared");
      window.setTimeout(() => setShareStatus("idle"), 1600);
      return;
    }

    await navigator.clipboard.writeText(absoluteUrl);
    setShareStatus("copied");
    window.setTimeout(() => setShareStatus("idle"), 1600);
  }

  async function handleShareResult() {
    if (!project.resultImageUrl || shareStatus === "sharing") {
      return;
    }

    setShareStatus("sharing");

    try {
      if (navigator.share) {
        const response = await fetch(project.resultImageUrl, { credentials: "include" });
        if (response.ok) {
          const blob = await response.blob();
          const mimeType = blob.type || response.headers.get("Content-Type") || "image/jpeg";
          const file = new File([blob], shareFileName(project.id, mimeType), { type: mimeType });
          const fileShareData: ShareData = {
            title: projectTitle,
            text: "خروجی آماده‌شده در اوالا",
            files: [file],
          };

          if (navigator.canShare?.(fileShareData)) {
            await navigator.share(fileShareData);
            setShareStatus("shared");
            window.setTimeout(() => setShareStatus("idle"), 1600);
            return;
          }
        }
      }

      await shareResultUrl(project.resultImageUrl);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setShareStatus("idle");
        return;
      }

      setShareStatus("failed");
      window.setTimeout(() => setShareStatus("idle"), 1800);
    }
  }

  async function handleSaveReference() {
    if (referenceSaveStatus === "saving") {
      return;
    }

    setReferenceSaveStatus("saving");
    const formData = new FormData();
    formData.set("projectId", project.id);

    const result = await saveProjectResultAsStyleReferenceAction(formData);
    setReferenceSaveStatus(result.ok ? "saved" : "failed");
    window.setTimeout(() => setReferenceSaveStatus("idle"), result.ok ? 1800 : 2400);
  }

  useEffect(() => {
    if (!fullscreen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeFullscreen();
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [closeFullscreen, fullscreen]);

  if (isActive) {
    return (
      <PageShell maxWidth="lg" minHeight={false} className="flex-1 overflow-hidden pb-0 text-surface">
        <ProjectStatusRefresh active={true} />

        <section className="flex h-full min-h-0 flex-col gap-3 overflow-hidden pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <DetailMeta
            projectId={project.id}
            title={projectTitle}
            variantLabel={variantLabel}
            styleName={project.style.name}
            styleSettings={styleSettings}
          />

          <ProcessingCanvas
            imageSrc={sourceImageSrc}
            fallbackSrc={uploadPreview.src}
            imageAlt="در حال پردازش تصویر"
            title={status.label}
            caption="می‌توانید از این صفحه خارج شوید و نتیجه را در تب پروژه‌ها ببینید."
            steps={["تشخیص محصول", "پاک‌سازی زمینه", "ساخت خروجی نهایی"]}
            moments={processingMoments}
            className="min-h-0 flex-1"
            frameClassName="h-full min-h-0"
          />

          <ActionDock columns={2} className="shrink-0 pb-0">
            <ButtonLink href="/projects" className="h-12 w-full rounded-[1rem] text-sm">
              <Gallery aria-hidden={true} className="h-4 w-4" />
              پروژه‌ها
            </ButtonLink>
            <ButtonLink href={newVersionHref} variant="secondary" className="h-12 w-full rounded-[1rem] text-sm">
              <Add aria-hidden={true} className="h-4 w-4" />
              پروژه جدید
            </ButtonLink>
          </ActionDock>
        </section>
      </PageShell>
    );
  }

  if (hasResult && project.status === "COMPLETED" && !resultImageError) {
    return (
      <PageShell maxWidth="lg" minHeight={false} className="h-[calc(100svh-9.25rem)] overflow-hidden pb-1 text-surface">
        <ProjectStatusRefresh active={titleRefreshPending} />

        <section className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
          <ResultHeader
            projectId={project.id}
            title={projectTitle}
            variantLabel={variantLabel}
            styleName={project.style.name}
            styleSettings={styleSettings}
          />

          <div
            className="group relative min-h-0 flex-1 overflow-hidden rounded-[1.25rem] text-right"
            role="button"
            tabIndex={0}
            aria-label="نمایش تمام صفحه خروجی"
            onClick={() => setFullscreen(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setFullscreen(true);
              }
            }}
          >
            <JewelryImageFrame
              aspect="portrait"
              treatment="dark"
              className="h-full w-full aspect-auto rounded-[1.25rem] border-white/10 bg-surface-photo shadow-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resultImageSrc}
                alt={project.title || "خروجی نهایی محصول"}
                className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-150 ${showBefore ? "opacity-0" : "opacity-100"}`}
                decoding="async"
                onError={() => {
                  console.error("[project-result-image-load-failed]", {
                    projectId: project.id,
                    resultImageUrl: project.resultImageUrl,
                  });
                  setResultImageLoadFailed(true);
                }}
              />
              <SafeJewelryImage
                src={sourceImageSrc}
                fallbackSrc={uploadPreview.src}
                fallbackAlt={uploadPreview.alt}
                alt="تصویر اولیه"
                fill
                className={`pointer-events-none object-cover object-center transition duration-150 ${showBefore ? "opacity-100" : "opacity-0"}`}
                sizes="(max-width: 768px) 100vw, 760px"
              />

              <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setShowBefore((current) => !current);
                  }}
                  aria-pressed={showBefore}
                  className={[
                    "relative z-10 inline-flex min-h-9 whitespace-nowrap items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold backdrop-blur transition",
                    showBefore
                      ? "bg-accent-wash text-accent-deep"
                      : "bg-black/42 text-white/86",
                  ].join(" ")}
                >
                  <Scan aria-hidden={true} className="h-4 w-4" />
                  {showBefore ? "خروجی" : "عکس خام"}
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setFullscreen(true);
                  }}
                  aria-label="نمایش تمام صفحه خروجی"
                  className="relative z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/42 text-surface backdrop-blur transition hover:bg-black/56"
                >
                  <Maximize4 aria-hidden={true} className="h-4.5 w-4.5" />
                </button>
              </div>
            </JewelryImageFrame>
          </div>

          <ActionDock className="shrink-0 pb-1">
            <div className="grid grid-cols-[0.82fr_minmax(0,1.18fr)_3rem] gap-2">
              <a
                href={project.resultImageUrl as string}
                download
                className={buttonClasses({
                  variant: "download",
                  className: "h-12 min-w-0 rounded-[0.95rem] px-2.5 text-sm",
                })}
              >
                <ArrowDown2 aria-hidden={true} className="h-4.5 w-4.5 stroke-[2.3]" />
                دانلود
              </a>
              {canCreateFreeVariant ? (
                <ButtonLink
                  href={freeVariantHref}
                  variant="ghost"
                  className="h-12 min-w-0 whitespace-nowrap rounded-[0.95rem] bg-white/[0.08] px-2.5 text-sm !text-surface/88 hover:bg-white/[0.12] hover:!text-surface"
                >
                  <Refresh aria-hidden={true} className="h-4 w-4" />
                  نسخه دیگر
                  <span className="inline-flex min-h-5 shrink-0 items-center rounded-full bg-[#f2dfbd] px-1.5 text-[10px] font-bold leading-none text-[#6f4d20]">
                    رایگان
                  </span>
                </ButtonLink>
              ) : (
                <ButtonLink
                  href={newVersionHref}
                  variant="ghost"
                  className="h-12 min-w-0 whitespace-nowrap rounded-[0.95rem] bg-white/[0.08] px-2.5 text-sm !text-surface/88 hover:bg-white/[0.12] hover:!text-surface"
                >
                  <Refresh aria-hidden={true} className="h-4 w-4" />
                  نسخه دیگر
                </ButtonLink>
              )}
              <div className="flex justify-end">
                <ItemContextMenu
                  label="گزینه‌های خروجی"
                  align="right"
                  tone="light"
                  buttonClassName="h-12 w-12 rounded-[0.95rem]"
                  buttonInnerClassName="h-12 w-12 rounded-[0.95rem] border border-white/10 bg-white/[0.1] text-surface hover:bg-white/[0.16]"
                  iconClassName="h-5 w-5"
                >
                  <button
                    type="button"
                    onClick={handleShareResult}
                    disabled={shareStatus === "sharing"}
                    className={contextMenuItemClasses}
                    data-close-context-menu
                  >
                    {shareStatus === "shared" || shareStatus === "copied" ? (
                      <TickCircle aria-hidden={true} className="h-3.5 w-3.5" />
                    ) : (
                      <ExportCurve aria-hidden={true} className="h-3.5 w-3.5" />
                    )}
                    اشتراک‌گذاری
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveReference}
                    disabled={referenceSaveStatus === "saving"}
                    className={contextMenuItemClasses}
                    data-close-context-menu
                  >
                    {referenceSaveStatus === "saved" ? (
                      <TickCircle aria-hidden={true} className="h-3.5 w-3.5 text-[#0f6f43]" />
                    ) : (
                      <GalleryAdd aria-hidden={true} className="h-3.5 w-3.5" />
                    )}
                    {referenceSaveStatus === "saving"
                      ? "در حال ذخیره..."
                      : referenceSaveStatus === "saved"
                        ? "ذخیره شد"
                        : referenceSaveStatus === "failed"
                          ? "ذخیره نشد"
                          : "ذخیره در نمونه‌ها"}
                  </button>
                  <ConfirmAction
                    action={archiveProjectAction}
                    fields={[{ name: "projectId", value: project.id }]}
                    title="آیا از انتقال پروژه به آرشیو مطمئنید؟"
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
          </ActionDock>
        </section>

        {fullscreen ? (
          <div
            className="fixed inset-0 z-50 bg-black text-surface"
            role="dialog"
            aria-modal="true"
            onClick={(event) => {
              event.stopPropagation();
              closeFullscreen();
            }}
          >
            <div className="absolute inset-x-4 top-[calc(env(safe-area-inset-top)+1rem)] z-20 flex items-start justify-between gap-3">
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setShowBefore((current) => !current);
                }}
                aria-pressed={showBefore}
                className={[
                  "inline-flex min-h-9 whitespace-nowrap items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold backdrop-blur transition",
                  showBefore
                    ? "bg-accent-wash text-accent-deep"
                    : "bg-black/42 text-white/86",
                ].join(" ")}
              >
                <Scan aria-hidden={true} className="h-4 w-4" />
                {showBefore ? "خروجی" : "عکس خام"}
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  closeFullscreen();
                }}
                aria-label="بستن نمایش تمام صفحه"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/42 text-white backdrop-blur transition hover:bg-black/56"
              >
                <CloseCircle aria-hidden={true} className="h-4.5 w-4.5" />
              </button>
            </div>
            <div className="relative h-full w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resultImageSrc}
                alt={project.title || "خروجی نهایی محصول"}
                draggable={false}
                className={`absolute inset-0 h-full w-full bg-black object-contain object-center transition-opacity duration-150 ${showBefore ? "opacity-0" : "opacity-100"}`}
                decoding="async"
                onError={() => {
                  console.error("[project-result-image-load-failed]", {
                    projectId: project.id,
                    resultImageUrl: project.resultImageUrl,
                  });
                  setResultImageLoadFailed(true);
                }}
              />
              <SafeJewelryImage
                src={sourceImageSrc}
                fallbackSrc={uploadPreview.src}
                fallbackAlt={uploadPreview.alt}
                alt="تصویر اولیه"
                fill
                className={`pointer-events-none object-contain transition duration-150 ${showBefore ? "opacity-100" : "opacity-0"}`}
                sizes="100vw"
              />
            </div>
          </div>
        ) : null}
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="lg" className="h-[calc(100svh-9.8rem)] overflow-hidden pb-1 text-surface">
      <ProjectStatusRefresh active={titleRefreshPending} />

      <section className="flex h-full flex-col gap-3 overflow-hidden">
        <DetailMeta
          projectId={project.id}
          title={projectTitle}
          variantLabel={variantLabel}
          styleName={project.style.name}
          styleSettings={styleSettings}
        />

        <JewelryImageFrame aspect="portrait" treatment="dark" className="min-h-0 flex-1 rounded-[1.45rem]">
          <SafeJewelryImage
            src={sourceImageSrc}
            fallbackSrc={uploadPreview.src}
            fallbackAlt={uploadPreview.alt}
            alt={project.title || "تصویر پروژه"}
            fill
            priority
            className="object-cover object-[46%_55%]"
            sizes="(max-width: 768px) 100vw, 760px"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/76 via-black/34 to-transparent p-4">
            <div className="rounded-[1.05rem] border border-white/12 bg-black/24 px-3.5 py-3 text-right backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1.5">
                  <p className="text-sm font-semibold leading-7 text-surface">
                    {errorPresentation.title}
                  </p>
                  <p className="break-words text-[12px] leading-6 text-surface/78">
                    {errorPresentation.description}
                  </p>
                  <p className="text-[11px] leading-6 text-surface/70">
                    {failedCreditReassurance}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyError}
                  aria-label={copiedError ? "خطا کپی شد" : "کپی خطا"}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/14 bg-white/10 text-surface/82 transition hover:bg-white/16"
                >
                  {copiedError ? <TickCircle aria-hidden={true} className="h-4 w-4" /> : <Copy aria-hidden={true} className="h-4 w-4" />}
                </button>
              </div>
              <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-white/10 pt-2 text-[10px] text-surface/72">
                <span>کد پیگیری</span>
                <span dir="ltr" className="font-semibold tracking-wide">{errorPresentation.supportCode}</span>
              </div>
            </div>
          </div>
        </JewelryImageFrame>

        <ActionDock className="shrink-0 pb-1">
          <form action={retryProjectAction}>
            <input type="hidden" name="projectId" value={project.id} />
            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[1rem] bg-foreground text-sm font-medium text-surface shadow-[0_20px_34px_-28px_rgba(17,16,14,0.85)] transition hover:bg-[#27231f]"
            >
              <Refresh aria-hidden={true} className="h-4 w-4" />
              تلاش دوباره
            </button>
          </form>
          <ButtonLink href="/projects" variant="secondary" className="h-11 w-full rounded-[1rem] text-sm">
            <Gallery aria-hidden={true} className="h-4 w-4" />
            پروژه‌ها
          </ButtonLink>
        </ActionDock>
      </section>
    </PageShell>
  );
}
