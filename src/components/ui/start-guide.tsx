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
  viewport: {
    width: number;
    height: number;
  };
};

function clamp(value: number, min: number, max: number) {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

function getSpotlightRect(target: GuideStep["target"], rect: TargetRect, frame: TargetRect | null, viewport: GuideRects["viewport"]) {
  const inset = 4;
  const frameLeft = frame?.left ?? 0;
  const frameTop = frame?.top ?? 0;
  const frameRight = frame?.right ?? viewport.width;
  const frameBottom = frame?.bottom ?? viewport.height;

  if (target === "new-project") {
    const diameter = Math.max(rect.width, rect.height) + inset * 2;
    const left = clamp(rect.left + rect.width / 2 - diameter / 2, frameLeft, frameRight - diameter);
    const top = clamp(rect.top + rect.height / 2 - diameter / 2, frameTop, frameBottom - diameter);

    return {
      top,
      left,
      width: diameter,
      height: diameter,
    };
  }

  const left = Math.max(frameLeft, rect.left - inset);
  const top = Math.max(frameTop, rect.top - inset);
  const right = Math.min(frameRight, rect.right + inset);
  const bottom = Math.min(frameBottom, rect.bottom + inset);

  return {
    top,
    left,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

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
  const [rects, setRects] = useState<GuideRects>({ target: null, frame: null, viewport: { width: 393, height: 852 } });

  useEffect(() => {
    function updateRects() {
      setRects({
        target: getTargetRect(target),
        frame: getPhoneFrameRect(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      });
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

type StartGuideProps = {
  enabled?: boolean;
};

export function StartGuide({ enabled = true }: StartGuideProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [stepIndex, setStepIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [pending, startTransition] = useTransition();
  const isProjectUploadGuide = pathname === "/projects/new" && searchParams.get("startGuide") === "upload";
  const step = isProjectUploadGuide ? uploadStep : steps[stepIndex];
  const { target: rect, frame, viewport } = useGuideRects(step.target);
  const isLastStep = !isProjectUploadGuide && stepIndex === steps.length - 1;
  const isUploadStep = step.target === "project-upload";
  const isNewProjectStep = step.target === "new-project";
  const spotlightRect = rect ? getSpotlightRect(step.target, rect, frame, viewport) : null;
  const spotlightRadius = isNewProjectStep ? 999 : 16;

  const bubbleStyle = useMemo<CSSProperties>(() => {
    const frameLeft = frame?.left ?? 16;
    const frameRight = frame?.right ?? viewport.width - 16;
    const frameTop = frame?.top ?? 0;
    const frameBottom = frame?.bottom ?? viewport.height;
    const bubbleWidth = isUploadStep
      ? Math.min(302, frameRight - frameLeft - 24)
      : isNewProjectStep
        ? frameRight - frameLeft - 32
        : Math.min(334, frameRight - frameLeft - 24);

    if (!rect) {
      return {
        width: bubbleWidth,
        left: frameLeft + 12,
        bottom: viewport.height - frameBottom + 112,
      };
    }

    const targetCenter = rect.left + rect.width / 2;
    const left = Math.min(Math.max(frameLeft + 12, targetCenter - bubbleWidth / 2), frameRight - bubbleWidth - 12);
    const estimatedBubbleHeight = isUploadStep ? 146 : 160;
    const gap = 14;
    const spaceAbove = rect.top - frameTop;
    const top = isUploadStep
      ? rect.bottom + 18
      : spaceAbove >= estimatedBubbleHeight + gap
      ? rect.top - estimatedBubbleHeight - gap
      : Math.min(rect.bottom + gap, frameBottom - estimatedBubbleHeight - 12);

    return {
      width: bubbleWidth,
      left,
      top: Math.max(frameTop + 12, top),
    };
  }, [frame, isNewProjectStep, isUploadStep, rect, viewport.height, viewport.width]);

  const pointerStyle = useMemo<CSSProperties | null>(() => {
    if (!rect || !frame) return null;

    const bubbleLeft = typeof bubbleStyle.left === "number" ? bubbleStyle.left : frame.left + 12;
    const targetCenter = rect.left + rect.width / 2;

    return {
      right: Math.max(22, (Number(bubbleStyle.width) || 302) - (targetCenter - bubbleLeft) - 7),
    };
  }, [bubbleStyle, frame, rect]);

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

  function goToUploadGuide() {
    setVisible(false);
    router.push("/projects/new?startGuide=upload");
  }

  function chooseUpload() {
    const target = document.querySelector<HTMLElement>('[data-start-guide-target="project-upload"]');
    setVisible(false);
    startTransition(() => {
      void dismissStartGuideAction();
    });
    target?.click();
  }

  if (!visible || (!enabled && !isProjectUploadGuide) || (pathname === "/projects/new" && !isProjectUploadGuide)) return null;

  return (
    <div dir="rtl" className="fixed inset-0 z-50 text-right">
      {spotlightRect ? (
        <>
          {isNewProjectStep ? (
            <div
              aria-hidden="true"
              className="pointer-events-none fixed inset-0"
              style={{
                background: `radial-gradient(circle at ${spotlightRect.left + spotlightRect.width / 2}px ${
                  spotlightRect.top + spotlightRect.height / 2
                }px, transparent 0 ${spotlightRect.width / 2}px, rgba(13,12,10,0.74) ${spotlightRect.width / 2 + 1}px)`,
              }}
            />
          ) : null}
          <div
            aria-hidden="true"
            className="pointer-events-none fixed border border-[#f5d9a4]/90"
            style={{
              top: spotlightRect.top,
              left: spotlightRect.left,
              width: spotlightRect.width,
              height: spotlightRect.height,
              borderRadius: spotlightRadius,
              boxShadow: isNewProjectStep
                ? "0 0 0 4px rgba(245,217,164,0.14), 0 14px 30px -24px rgba(245,217,164,0.86)"
                : "0 0 0 4px rgba(245,217,164,0.14), 0 14px 30px -24px rgba(245,217,164,0.86), 0 0 0 9999px rgba(13,12,10,0.74)",
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-[#0d0c0a]/72 backdrop-blur-[1px]" />
      )}

      {spotlightRect ? (
        <>
          {isLastStep || isUploadStep ? (
            <button
              type="button"
              aria-label={isUploadStep ? "آپلود عکس محصول" : "شروع پروژه جدید"}
              disabled={pending}
              onClick={isUploadStep ? chooseUpload : goToUploadGuide}
              className="fixed rounded-full focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
              style={{
                top: spotlightRect.top - 2,
                left: spotlightRect.left - 2,
                width: spotlightRect.width + 4,
                height: spotlightRect.height + 4,
                borderRadius: spotlightRadius,
              }}
            />
          ) : null}
        </>
      ) : null}

      <section
        className="fixed rounded-[var(--radius-xl)] border border-white/78 bg-surface p-3.5 text-foreground shadow-[0_26px_70px_-34px_rgba(0,0,0,0.76)]"
        style={{ ...bubbleStyle, height: isUploadStep ? undefined : 160 }}
        aria-live="polite"
      >
        {isUploadStep && pointerStyle ? (
          <span
            aria-hidden="true"
            className="absolute -top-1.5 h-3 w-3 rotate-45 border-r border-t border-white/78 bg-surface"
            style={pointerStyle}
          />
        ) : null}
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-soft text-[#7b5d31]">
            <Magicpen aria-hidden={true} className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold leading-6 text-foreground">{step.title}</h2>
            <p className="mt-1 min-h-12 text-xs leading-6 text-muted">{step.body}</p>
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
            {isUploadStep ? "انتخاب عکس" : isLastStep ? "شروع" : "بعدی"}
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
