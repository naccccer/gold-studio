"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import { I3DCubeScan, MagicStar } from "vuesax-icons-react";

type ProcessingCanvasProps = {
  imageSrc: string | StaticImageData;
  imageAlt?: string;
  steps: string[];
  moments?: Array<{
    step: string;
    phase: number;
  }>;
  title?: string;
  caption?: string;
  className?: string;
  frameClassName?: string;
};

export function ProcessingCanvas({
  imageSrc,
  imageAlt = "",
  steps,
  moments,
  title = "در حال آماده‌سازی",
  caption = "استودیو اوالا روی تمیزسازی، نور، و خروجی نهایی کار می‌کند.",
  className = "",
  frameClassName = "",
}: ProcessingCanvasProps) {
  const timeline = moments && moments.length > 0
    ? moments
    : steps.map((step, index) => ({
        step,
        phase: index,
      }));
  const [activeIndex, setActiveIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const visibleIndex = reduceMotion ? 0 : activeIndex;
  const currentMoment = timeline[visibleIndex] ?? timeline[0];

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReduceMotion(media.matches);

    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (reduceMotion || timeline.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % timeline.length);
    }, 2100);

    return () => window.clearInterval(interval);
  }, [reduceMotion, timeline.length]);

  return (
    <div className={["space-y-3", className].filter(Boolean).join(" ")}>
      <div
        className={[
          "relative h-[392px] w-full overflow-hidden rounded-[1.6rem] border border-white/12 bg-studio-surface shadow-[var(--shadow-studio-frame)]",
          frameClassName,
        ].filter(Boolean).join(" ")}
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="scale-[1.04] object-cover object-[48%_54%] opacity-62 blur-[1.5px]"
          sizes="(max-width: 640px) 100vw, 430px"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,253,249,0.06)_0%,rgba(17,16,14,0.22)_54%,rgba(13,12,10,0.84)_100%)]" />
        <div className="absolute inset-x-10 top-8 h-px animate-[ovalaProcessingScan_3s_ease-in-out_infinite] bg-gradient-to-l from-transparent via-[#fff7e7]/85 to-transparent" />
        <div className="absolute inset-x-8 bottom-8 top-8 rounded-[1.25rem] border border-white/18" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/14 bg-black/26 px-2.5 py-1 text-[10px] font-semibold text-surface/82 backdrop-blur">
              <MagicStar aria-hidden={true} className="h-3.5 w-3.5" />
              پردازش استودیویی
            </span>
            <div className="space-y-1">
              <p className="text-base font-semibold text-surface">{title}</p>
              <p
                className="max-w-[15rem] text-right text-xs leading-6 text-surface/72"
                style={{ textAlign: "justify", textAlignLast: "right" }}
              >
                {caption}
              </p>
            </div>
          </div>
          <span className="rounded-full border border-white/14 bg-black/24 px-3 py-1 text-[10px] font-medium text-surface/72">
            {`${((currentMoment?.phase ?? 0) + 1).toLocaleString("fa-IR")} / ${steps.length.toLocaleString("fa-IR")}`}
          </span>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="relative inline-flex h-[78px] w-[78px] items-center justify-center rounded-full border border-white/34 bg-[#11100e]/58 text-surface shadow-[0_20px_44px_-26px_rgba(17,16,14,0.9)] backdrop-blur">
            <span className="absolute -inset-4 animate-[ovalaLoadingPulse_2.4s_ease-in-out_infinite] rounded-full border border-white/12" />
            <span className="absolute -inset-8 animate-[ovalaLoadingPulse_2.4s_ease-in-out_infinite_600ms] rounded-full border border-accent/18" />
            <span className="absolute inset-2 animate-spin rounded-full border border-white/16 border-t-white/78" />
            <I3DCubeScan aria-hidden={true} className="h-7 w-7" />
          </span>
        </div>
      </div>

      <div className="rounded-[1.15rem] border border-white/12 bg-white/[0.06] p-2.5">
        <div
          key={`${currentMoment?.phase ?? 0}-${visibleIndex}`}
          className="rounded-[0.95rem] border border-accent-bright/40 bg-accent-wash/12 px-3 py-3 animate-[ovalaProcessingCardIn_560ms_ease-out]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-bright text-[11px] font-semibold text-studio-control">
                  {((currentMoment?.phase ?? 0) + 1).toLocaleString("fa-IR")}
                </span>
                <p className="truncate text-[14px] font-semibold text-surface">
                  {currentMoment?.step}
                </p>
              </div>
            </div>
            <span className="shrink-0 text-[10px] font-medium text-accent-soft">
              در حال انجام
            </span>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            {steps.map((step, index) => {
              const active = index === (currentMoment?.phase ?? 0);
              const completed = index < (currentMoment?.phase ?? 0);

              return (
                <span
                  key={step}
                  className={`h-1.5 rounded-full transition ${
                    active
                      ? "w-8 animate-[ovalaProcessingProgress_1.8s_ease-in-out_infinite] bg-accent-bright"
                      : completed
                        ? "w-5 bg-accent/60"
                        : "w-5 bg-white/16"
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
