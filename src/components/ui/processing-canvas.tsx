"use client";

import { useEffect, useState } from "react";
import type { StaticImageData } from "next/image";
import { I3DCubeScan } from "vuesax-icons-react";
import { SafeJewelryImage } from "@/components/ui/safe-jewelry-image";

type ProcessingCanvasProps = {
  imageSrc: string | StaticImageData;
  fallbackSrc: string;
  imageAlt?: string;
  steps: string[];
  moments?: Array<{
    step: string;
    phase: number;
  }>;
  title?: string;
  styleLabel?: string;
  caption?: string;
  className?: string;
  frameClassName?: string;
};

export function ProcessingCanvas({
  imageSrc,
  fallbackSrc,
  imageAlt = "",
  steps,
  moments,
  title = "در حال آماده‌سازی",
  styleLabel,
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
    <div className={["min-h-0", className].filter(Boolean).join(" ")}>
      <div
        className={[
          "relative h-[392px] w-full overflow-hidden rounded-[1.6rem] border border-white/12 bg-studio-surface shadow-[var(--shadow-studio-frame)]",
          frameClassName,
        ].filter(Boolean).join(" ")}
      >
        <SafeJewelryImage
          src={imageSrc}
          fallbackSrc={fallbackSrc}
          fallbackAlt={imageAlt}
          alt={imageAlt}
          fill
          className="scale-[1.08] object-cover object-[48%_54%] opacity-48 blur-[10px] saturate-75"
          sizes="(max-width: 640px) 100vw, 430px"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,253,249,0.06)_0%,rgba(17,16,14,0.22)_54%,rgba(13,12,10,0.84)_100%)]" />
        <div className="absolute inset-x-10 top-8 h-px animate-[ovalaProcessingScan_3s_ease-in-out_infinite] bg-gradient-to-l from-transparent via-[#fff7e7]/85 to-transparent" />
        <div className="absolute inset-x-8 bottom-8 top-8 rounded-[1.25rem] border border-white/18" />

        <div className="absolute inset-x-0 top-0 p-4">
          {styleLabel ? (
            <span className="absolute left-4 top-4 rounded-full border border-white/14 bg-black/26 px-3 py-1 text-[10px] font-semibold text-surface/82 backdrop-blur">
              {styleLabel}
            </span>
          ) : null}
          <div className="ml-auto max-w-[calc(100%-7.5rem)] space-y-2 text-right">
            <p className="text-base font-semibold text-surface">{title}</p>
            <p className="text-right text-xs leading-6 text-surface/72">
              {caption}
            </p>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="relative inline-flex h-[78px] w-[78px] items-center justify-center rounded-full border border-white/34 bg-[#11100e]/58 text-surface shadow-[0_20px_44px_-26px_rgba(17,16,14,0.9)] backdrop-blur">
            <span className="absolute -inset-4 animate-[ovalaLoadingPulse_2.4s_ease-in-out_infinite] rounded-full border border-white/12" />
            <span className="absolute -inset-8 animate-[ovalaLoadingPulse_2.4s_ease-in-out_infinite_600ms] rounded-full border border-accent/18" />
            <span className="absolute inset-2 animate-spin rounded-full border border-white/16 border-t-white/78" />
            <I3DCubeScan aria-hidden={true} className="h-7 w-7" />
          </span>
        </div>

        <div className="absolute inset-x-4 bottom-4 rounded-[1.05rem] border border-white/12 bg-black/32 px-3.5 py-3 text-center shadow-[0_18px_46px_-30px_rgba(0,0,0,0.9)] backdrop-blur">
          <div
            key={`${currentMoment?.phase ?? 0}-${visibleIndex}`}
            className="animate-[ovalaProcessingCardIn_560ms_ease-out]"
          >
            <p className="truncate text-center text-[14px] font-semibold text-surface">{currentMoment?.step}</p>
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
    </div>
  );
}
