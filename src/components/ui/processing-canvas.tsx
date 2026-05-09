import Image from "next/image";
import type { StaticImageData } from "next/image";
import { Aperture } from "lucide-react";

type ProcessingCanvasProps = {
  imageSrc: string | StaticImageData;
  imageAlt?: string;
  steps: string[];
  className?: string;
  frameClassName?: string;
};

export function ProcessingCanvas({ imageSrc, imageAlt = "", steps, className = "", frameClassName = "" }: ProcessingCanvasProps) {
  return (
    <div className={["space-y-3", className].filter(Boolean).join(" ")}>
      <div className={["relative h-[430px] w-full overflow-hidden rounded-[1.6rem] border border-white/80 bg-surface-muted shadow-[0_28px_58px_-46px_rgba(17,16,14,0.78)]", frameClassName].filter(Boolean).join(" ")}>
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="scale-[1.04] object-cover object-[48%_54%] opacity-70 blur-[1.5px]"
          sizes="(max-width: 640px) 100vw, 430px"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(255,253,249,0.06)_0%,rgba(17,16,14,0.24)_64%,rgba(17,16,14,0.34)_100%)]" />
        <div className="absolute inset-x-10 top-8 h-px animate-[ovalaProcessingScan_3s_ease-in-out_infinite] bg-gradient-to-l from-transparent via-[#fff7e7]/85 to-transparent" />
        <div className="absolute inset-x-8 bottom-8 top-8 rounded-[1.25rem] border border-white/26" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="relative inline-flex h-[74px] w-[74px] items-center justify-center rounded-full border border-white/42 bg-[#11100e]/50 text-surface shadow-[0_20px_44px_-26px_rgba(17,16,14,0.9)] backdrop-blur">
            <span className="absolute -inset-4 animate-[ovalaLoadingPulse_2.4s_ease-in-out_infinite] rounded-full border border-white/16" />
            <span className="absolute -inset-8 animate-[ovalaLoadingPulse_2.4s_ease-in-out_infinite_600ms] rounded-full border border-accent/18" />
            <span className="absolute inset-2 animate-spin rounded-full border border-white/18 border-t-white/78" />
            <Aperture aria-hidden="true" className="h-6 w-6" strokeWidth={1.45} />
          </span>
        </div>
      </div>

      <div className="rounded-[1.15rem] border border-white/72 bg-surface/68 p-2.5">
        <div className="relative h-8 overflow-hidden">
          {steps.map((step, index) => (
            <p
              key={step}
              className="absolute inset-0 flex items-center justify-center text-sm font-semibold leading-none text-foreground"
              style={{ animation: "ovalaProcessingStep 6s ease-in-out infinite", animationDelay: `${index * -2}s`, opacity: 0 }}
            >
              {step}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
