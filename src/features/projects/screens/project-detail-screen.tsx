"use client";

import { useEffect, useState } from "react";
import {
  Add,
  CloseCircle,
  Danger,
  DocumentDownload,
  Gallery,
  Maximize4,
  Refresh,
} from "vuesax-icons-react";
import { ActionDock } from "@/components/ui/action-dock";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
import { ProcessingCanvas } from "@/components/ui/processing-canvas";
import { SafeJewelryImage } from "@/components/ui/safe-jewelry-image";
import { retryProjectAction } from "@/features/projects/actions";
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
      title: "سرویس تولید موقتاً آماده نبود",
      description: "پردازش از سمت سرویس تولید متوقف شد. این مورد معمولاً با پیگیری پشتیبانی یا تلاش دوباره برطرف می‌شود.",
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

  if (normalized.includes("network") || normalized.includes("fetch")) {
    return {
      title: "ارتباط با سرویس تولید کامل نشد",
      description: "در ارتباط با سرویس پردازش اختلال کوتاه رخ داد. تلاش دوباره معمولاً کافی است.",
      supportCode,
    };
  }

  return {
    title: "پروژه کامل نشد",
    description: "جزئیات فنی این خطا برای کاربر نمایش داده نمی‌شود. اگر با تلاش دوباره حل نشد، کد پیگیری را برای پشتیبانی ارسال کنید.",
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
    "اعمال کارهای عجیب!",
  ];
  const phaseTwo = [
    "چیدمان قاب",
    "صیقل نهایی",
    "آماده‌سازی خروجی",
    "لمس آخر",
  ];

  return Array.from({ length: 4 }).flatMap((_, index) => ([
    { step: phaseZero[index], phase: 0 },
    { step: phaseOne[index], phase: 1 },
    { step: phaseTwo[index], phase: 2 },
  ]));
}

export type ProjectDetail = {
  id: string;
  title: string | null;
  sourceAssetId: string | null;
  sourceImageUrl: string;
  resultImageUrl: string | null;
  status: string;
  style: { name: string };
  errorMessage: string | null;
  createdAt?: Date;
};

const failedCreditReassurance =
  "اگر پردازش این پروژه کامل نشود، اعتباری از حساب شما کسر نخواهد شد.";

type ProjectDetailScreenProps = { project: ProjectDetail };

export function ProjectDetailScreen({ project }: ProjectDetailScreenProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const [showBefore, setShowBefore] = useState(false);
  const status = statusConfig[project.status] ?? {
    label: "ثبت شده",
    supportCopy: "وضعیت پروژه ثبت شد.",
  };
  const hasResult = Boolean(project.resultImageUrl);
  const isActive = project.status === "QUEUED" || project.status === "PROCESSING";
  const resultImageSrc = project.resultImageUrl || resultHeroDark.src;
  const sourceImageSrc = project.sourceImageUrl || uploadPreview.src;
  const newVersionHref = project.sourceAssetId ? `/projects/new?assetId=${project.sourceAssetId}` : "/projects/new";
  const processingMoments = buildProcessingMoments(project.style.name);
  const errorPresentation = formatProjectError(project);

  useEffect(() => {
    if (!fullscreen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setFullscreen(false);
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [fullscreen]);

  if (isActive) {
    return (
      <PageShell maxWidth="lg" minHeight={false} className="flex-1 overflow-hidden pb-0 text-surface">
        <ProjectStatusRefresh active={true} />

        <section className="flex h-full min-h-0 flex-col gap-3 overflow-hidden pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <ProcessingCanvas
            imageSrc={sourceImageSrc}
            imageAlt="در حال پردازش تصویر"
            title={status.label}
            caption={`${project.style.name} در حال اجراست. می‌توانید از این صفحه خارج شوید و وضعیت پروژه را بعداً در پروژه‌ها ببینید.`}
            steps={["تشخیص محصول", "پاک‌سازی زمینه", "ساخت خروجی نهایی"]}
            moments={processingMoments}
            className="min-h-0 flex-1"
            frameClassName="h-[calc(100%-7.8rem)] min-h-0"
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

  if (hasResult && project.status === "COMPLETED") {
    return (
      <PageShell maxWidth="lg" className="h-[calc(100svh-9.8rem)] overflow-hidden pb-1 text-surface">
        <section className="flex h-full flex-col gap-3 overflow-hidden">
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            onPointerDown={() => setShowBefore(true)}
            onPointerLeave={() => setShowBefore(false)}
            onPointerCancel={() => setShowBefore(false)}
            onPointerUp={() => setShowBefore(false)}
            className="group relative min-h-0 flex-1 cursor-zoom-in overflow-hidden rounded-[1.45rem] border border-white/12 bg-[#11100e] text-right shadow-[0_28px_58px_-46px_rgba(17,16,14,0.82)]"
            aria-label="نمایش تمام صفحه خروجی"
          >
            <SafeJewelryImage
              src={resultImageSrc}
              fallbackSrc={resultHeroDark.src}
              fallbackAlt={resultHeroDark.alt}
              alt={project.title || "خروجی نهایی محصول"}
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 760px"
            />
            <SafeJewelryImage
              src={sourceImageSrc}
              fallbackSrc={uploadPreview.src}
              fallbackAlt={uploadPreview.alt}
              alt="تصویر اولیه"
              fill
              className={`pointer-events-none object-cover object-[46%_55%] transition duration-150 ${showBefore ? "opacity-100" : "opacity-0"}`}
              sizes="(max-width: 768px) 100vw, 760px"
            />
            <div className="absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/28 text-surface backdrop-blur">
              <Maximize4 aria-hidden={true} className="h-4.5 w-4.5" />
            </div>
          </button>

          <ActionDock className="shrink-0 pb-1" columns={2}>
            <a
              href={project.resultImageUrl as string}
              download
              className={buttonClasses({
                className: "h-12 w-full rounded-[1rem]",
              })}
            >
              <DocumentDownload aria-hidden={true} className="h-4 w-4" />
              ذخیره
            </a>
            <ButtonLink href={newVersionHref} variant="secondary" className="h-12 w-full rounded-[1rem] text-sm">
              <Refresh aria-hidden={true} className="h-4 w-4" />
              نسخه دیگر
            </ButtonLink>
          </ActionDock>
        </section>

        {fullscreen ? (
          <div className="fixed inset-0 z-50 bg-black text-surface" role="dialog" aria-modal="true">
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              aria-label="بستن نمایش تمام صفحه"
              className="absolute left-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/16 bg-white/10 text-white backdrop-blur"
            >
              <CloseCircle aria-hidden={true} className="h-5 w-5" />
            </button>
            <div
              className="relative h-full w-full"
              onPointerDown={() => setShowBefore(true)}
              onPointerLeave={() => setShowBefore(false)}
              onPointerCancel={() => setShowBefore(false)}
              onPointerUp={() => setShowBefore(false)}
            >
              <SafeJewelryImage
                src={resultImageSrc}
                fallbackSrc={resultHeroDark.src}
                fallbackAlt={resultHeroDark.alt}
                alt={project.title || "خروجی نهایی محصول"}
                fill
                priority
                className="object-contain"
                sizes="100vw"
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
      <section className="flex h-full flex-col gap-3 overflow-hidden">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[1.45rem] border border-white/12 bg-[#1a1713] shadow-[0_28px_58px_-46px_rgba(17,16,14,0.82)]">
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
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/18 to-transparent p-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-black/30 px-2.5 py-1 text-[10px] text-surface/82">
              <Danger aria-hidden={true} className="h-3.5 w-3.5" />
              {status.label}
            </p>
            <div className="mt-2 space-y-2">
              <p
                className="text-sm font-semibold leading-7 text-surface"
                style={{ textAlign: "justify", textAlignLast: "right" }}
              >
                {errorPresentation.title}
              </p>
              <p
                className="text-[12px] leading-6 text-surface/76"
                style={{ textAlign: "justify", textAlignLast: "right" }}
              >
                {errorPresentation.description}
              </p>
              <p
                className="rounded-[0.9rem] border border-white/12 bg-white/8 px-3 py-2 text-[11px] leading-6 text-surface/84"
                style={{ textAlign: "justify", textAlignLast: "right" }}
              >
                {failedCreditReassurance}
              </p>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/24 px-2.5 py-1 text-[10px] text-surface/72">
                <span>کد پیگیری</span>
                <span dir="ltr" className="font-semibold tracking-wide">{errorPresentation.supportCode}</span>
              </p>
            </div>
          </div>
        </div>
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
