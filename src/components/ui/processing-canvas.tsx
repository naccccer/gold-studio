"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import { I3DCubeScan, MagicStar, TickCircle } from "vuesax-icons-react";

type ProcessingCanvasProps = {
  imageSrc: string | StaticImageData;
  imageAlt?: string;
  steps: string[];
  title?: string;
  caption?: string;
  className?: string;
  frameClassName?: string;
};

export function ProcessingCanvas({
  imageSrc,
  imageAlt = "",
  steps,
  title = "در حال آماده‌سازی",
  caption = "استودیو اوالا روی تمیزسازی، نور، و خروجی نهایی کار می‌کند.",
  className = "",
  frameClassName = "",
}: ProcessingCanvasProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const visibleIndex = reduceMotion ? 0 : activeIndex;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReduceMotion(media.matches);

    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (reduceMotion || steps.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % steps.length);
    }, 2200);

    return () => window.clearInterval(interval);
  }, [reduceMotion, steps.length]);

  return (
    <div className={["space-y-3", className].filter(Boolean).join(" ")}>
      <div
        className={[
          "relative h-[430px] w-full overflow-hidden rounded-[1.6rem] border border-white/12 bg-studio-surface shadow-[var(--shadow-studio-frame)]",
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
              <p className="max-w-[15rem] text-xs leading-6 text-surface/72">{caption}</p>
            </div>
          </div>
          <span className="rounded-full border border-white/14 bg-black/24 px-3 py-1 text-[10px] font-medium text-surface/72">
            {`${(visibleIndex + 1).toLocaleString("fa-IR")} / ${steps.length.toLocaleString("fa-IR")}`}
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

      <div className="rounded-[1.15rem] border border-white/12 bg-white/[0.06] p-3">
        <div className="space-y-2.5">
          {steps.map((step, index) => {
            const completed = index < visibleIndex;
            const active = index === visibleIndex;

            return (
              <div
                key={step}
                className={`flex items-center justify-between gap-3 rounded-[0.95rem] border px-3 py-2.5 transition ${
                  active
                    ? "border-accent-bright/44 bg-accent-wash/14"
                    : completed
                      ? "border-white/12 bg-white/[0.08]"
                      : "border-white/8 bg-black/12"
                }`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      active
                        ? "bg-accent-bright text-studio-control"
                        : completed
                          ? "bg-white/12 text-surface"
                          : "bg-white/8 text-surface/58"
                    }`}
                  >
                    {completed ? <TickCircle aria-hidden={true} className="h-4 w-4" /> : (index + 1).toLocaleString("fa-IR")}
                  </span>
                  <p className={`truncate text-sm font-medium ${active ? "text-surface" : completed ? "text-surface/84" : "text-surface/62"}`}>
                    {step}
                  </p>
                </div>
                <span className={`shrink-0 text-[10px] font-medium ${active ? "text-accent-soft" : completed ? "text-surface/58" : "text-surface/44"}`}>
                  {active ? "در حال انجام" : completed ? "انجام شد" : "در انتظار"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
