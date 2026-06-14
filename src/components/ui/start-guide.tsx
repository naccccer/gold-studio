"use client";

import { ArrowLeft, CloseCircle, Magicpen } from "vuesax-icons-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { dismissStartGuideAction } from "@/features/account/actions";

type GuideStep = {
  target: "gallery" | "projects" | "new-project" | "project-upload";
  title: string;
  body: string;
};

type TargetRect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
};

type GuideRects = {
  target: TargetRect | null;
  frame: TargetRect | null;
};

const steps: GuideStep[] = [
  {
    target: "gallery",
    title: "گالری عکس‌های محصول",
    body: "عکس‌های خامی که آپلود می‌کنی اینجا می‌مانند.",
  },
  {
    target: "projects",
    title: "پروژه‌ها",
    body: "خروجی‌ها، وضعیت ساخت و نتیجه‌های نهایی اینجا دیده می‌شوند.",
  },
  {
    target: "new-project",
    title: "شروع از اینجا",
    body: "برای ساخت اولین عکس استودیویی، پروژه جدید بساز.",
  },
];

const uploadStep: GuideStep = {
  target: "project-upload",
  title: "آپلود عکس محصول",
  body: "از اینجا عکس خام محصولت را انتخاب کن تا آماده ساخت خروجی شود.",
};

function getTargetRect(target: GuideStep["target"]): TargetRect | null {
  const element = document.querySelector<HTMLElement>(`[data-start-guide-target="${target}"]`);
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function getPhoneFrameRect(): TargetRect | null {
  const element = document.querySelector<HTMLElement>("[data-ovala-phone-frame]");
  const rect = element?.getBoundingClientRect();
  if (!rect) return null;

  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function useGuideRects(target: GuideStep["target"]) {
  const [rects, setRects] = useState<GuideRects>({ target: null, frame: null });

  useEffect(() => {
    function updateRects() {
      setRects({ target: getTargetRect(target), frame: getPhoneFrameRect() });
    }

    updateRects();
    const animationFrame = window.requestAnimationFrame(updateRects);
    window.addEventListener("resize", updateRects);
    window.addEventListener("scroll", updateRects, true);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", updateRects);
      window.removeEventListener("scroll", updateRects, true);
    };
  }, [target]);

  return rects;
}

export function StartGuide() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [stepIndex, setStepIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [pending, startTransition] = useTransition();
  const isProjectUploadGuide = pathname === "/projects/new";
  const step = isProjectUploadGuide ? uploadStep : steps[stepIndex];
  const { target: rect, frame } = useGuideRects(step.target);
  const isLastStep = !isProjectUploadGuide && stepIndex === steps.length - 1;
  const isUploadStep = step.target === "project-upload";
  const spotlightRect = rect
    ? {
        top: Math.max(frame?.top ?? 0, rect.top - 4),
        right: Math.max(0, window.innerWidth - Math.min(frame?.right ?? window.innerWidth, rect.right + 4)),
        left: Math.max(frame?.left ?? 0, rect.left - 4),
        width: rect.width + 8,
        height: rect.height + 8,
      }
    : null;
  const spotlightRadius = step.target === "new-project" ? 999 : 16;

  const bubbleStyle = useMemo<CSSProperties>(() => {
    const frameLeft = frame?.left ?? 16;
    const frameRight = frame?.right ?? window.innerWidth - 16;
    const frameTop = frame?.top ?? 0;
    const frameBottom = frame?.bottom ?? window.innerHeight;
    const bubbleWidth = Math.min(334, frameRight - frameLeft - 24);

    if (!rect) {
      return {
        width: bubbleWidth,
        left: frameLeft + 12,
        bottom: window.innerHeight - frameBottom + 112,
      };
    }

    const targetCenter = rect.left + rect.width / 2;
    const left = Math.min(Math.max(frameLeft + 12, targetCenter - bubbleWidth / 2), frameRight - bubbleWidth - 12);
    const estimatedBubbleHeight = 146;
    const gap = 14;
    const spaceAbove = rect.top - frameTop;
    const top = spaceAbove >= estimatedBubbleHeight + gap
      ? rect.top - estimatedBubbleHeight - gap
      : Math.min(rect.bottom + gap, frameBottom - estimatedBubbleHeight - 12);

    return {
      width: bubbleWidth,
      left,
      top: Math.max(frameTop + 12, top),
    };
  }, [frame, rect]);

  function markSeen(afterSeen?: () => void) {
    startTransition(() => {
      void dismissStartGuideAction().finally(() => {
        setVisible(false);
        afterSeen?.();
      });
    });
  }

  function skipGuide() {
    markSeen();
  }

  function nextStep() {
    if (isLastStep) {
      setVisible(false);
      router.push("/projects/new?startGuide=upload");
      return;
    }

    setStepIndex((value) => value + 1);
  }

  function chooseUpload() {
    const target = document.querySelector<HTMLElement>('[data-start-guide-target="project-upload"]');
    setVisible(false);
    startTransition(() => {
      void dismissStartGuideAction();
    });
    target?.click();
  }

  if (!visible || (pathname === "/projects/new" && searchParams.get("startGuide") !== "upload")) return null;

  return (
    <div dir="rtl" className="fixed inset-0 z-50 text-right">
      {spotlightRect ? (
        <svg aria-hidden="true" className="pointer-events-none fixed inset-0 h-full w-full">
          <defs>
            <mask id="start-guide-spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={spotlightRect.left}
                y={spotlightRect.top}
                width={spotlightRect.width}
                height={spotlightRect.height}
                rx={spotlightRadius}
                ry={spotlightRadius}
                fill="black"
              />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(13,12,10,0.74)" mask="url(#start-guide-spotlight-mask)" />
        </svg>
      ) : (
        <div className="absolute inset-0 bg-[#0d0c0a]/72 backdrop-blur-[1px]" />
      )}

      {spotlightRect ? (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none fixed border border-[#f5d9a4]/90 shadow-[0_0_0_4px_rgba(245,217,164,0.13),0_14px_30px_-24px_rgba(245,217,164,0.86)]"
            style={{
              top: spotlightRect.top,
              right: spotlightRect.right,
              width: spotlightRect.width,
              height: spotlightRect.height,
              borderRadius: spotlightRadius,
            }}
          />
          {isLastStep || isUploadStep ? (
            <button
              type="button"
              aria-label={isUploadStep ? "آپلود عکس محصول" : "شروع پروژه جدید"}
              disabled={pending}
              onClick={isUploadStep ? chooseUpload : () => router.push("/projects/new?startGuide=upload")}
              className="fixed rounded-full focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
              style={{
                top: spotlightRect.top - 2,
                right: spotlightRect.right - 2,
                width: spotlightRect.width + 4,
                height: spotlightRect.height + 4,
              }}
            />
          ) : null}
        </>
      ) : null}

      <section
        className="fixed rounded-[var(--radius-xl)] border border-white/78 bg-surface p-3.5 text-foreground shadow-[0_26px_70px_-34px_rgba(0,0,0,0.76)]"
        style={bubbleStyle}
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-soft text-[#7b5d31]">
            <Magicpen aria-hidden={true} className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold leading-6 text-foreground">{step.title}</h2>
            <p className="mt-1 text-xs leading-6 text-muted">{step.body}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant={isLastStep ? "primary" : "secondary"}
            size="sm"
            disabled={pending}
            onClick={isUploadStep ? chooseUpload : nextStep}
            className="min-w-24"
          >
            {isUploadStep ? "آپلود عکس" : isLastStep ? "شروع" : "بعدی"}
            {isLastStep || isUploadStep ? <Magicpen aria-hidden={true} className="h-4 w-4" /> : <ArrowLeft aria-hidden={true} className="h-4 w-4" />}
          </Button>
          <button
            type="button"
            disabled={pending}
            onClick={skipGuide}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-lg)] px-3 text-xs font-semibold text-muted transition hover:bg-surface-soft hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] disabled:pointer-events-none disabled:opacity-60"
          >
            رد کردن
            <CloseCircle aria-hidden={true} className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
