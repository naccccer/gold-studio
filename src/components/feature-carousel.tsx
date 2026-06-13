"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type FeatureCarouselImage = {
  src: string;
  alt: string;
  beforeSrc?: string;
  beforeAlt?: string;
};

type FeatureCarouselProps = Omit<React.HTMLAttributes<HTMLDivElement>, "title"> & {
  title?: React.ReactNode;
  subtitle?: string;
  images: FeatureCarouselImage[];
  variant?: "hero" | "compact";
};

export const FeatureCarousel = React.forwardRef<HTMLDivElement, FeatureCarouselProps>(
  ({ title, subtitle, images, variant = "hero", className, ...props }, ref) => {
    const [currentIndex, setCurrentIndex] = React.useState(() => Math.floor(images.length / 2));
    const [slidePhases, setSlidePhases] = React.useState<Record<number, "before" | "after">>({});
    const [phaseHold, setPhaseHold] = React.useState<{ index: number; phase: "before" | "after" } | null>(null);
    const [dragOffset, setDragOffset] = React.useState(0);
    const [isDragging, setIsDragging] = React.useState(false);
    const dragStartX = React.useRef<number | null>(null);
    const currentPhase = slidePhases[currentIndex] ?? "before";

    const handleNext = React.useCallback(() => {
      if (images.length === 0) return;
      const nextIndex = (currentIndex + 1) % images.length;
      setPhaseHold({ index: currentIndex, phase: currentPhase });
      setSlidePhases((phases) => ({ ...phases, [nextIndex]: "before" }));
      setCurrentIndex(nextIndex);
    }, [currentIndex, currentPhase, images.length]);

    const handlePrev = React.useCallback(() => {
      if (images.length === 0) return;
      const nextIndex = (currentIndex - 1 + images.length) % images.length;
      setPhaseHold({ index: currentIndex, phase: currentPhase });
      setSlidePhases((phases) => ({ ...phases, [nextIndex]: "before" }));
      setCurrentIndex(nextIndex);
    }, [currentIndex, currentPhase, images.length]);

    React.useEffect(() => {
      if (!phaseHold) return;
      const timer = window.setTimeout(() => setPhaseHold(null), 850);
      return () => window.clearTimeout(timer);
    }, [phaseHold]);

    React.useEffect(() => {
      if (images.length === 0 || isDragging) return;
      const delay = currentPhase === "after" ? 3200 : 2000;
      const timer = window.setTimeout(() => {
        if (currentPhase === "before" && images[currentIndex]?.beforeSrc) {
          setSlidePhases((phases) => ({ ...phases, [currentIndex]: "after" }));
          return;
        }

        if (images.length > 1) {
          handleNext();
        } else {
          setSlidePhases((phases) => ({
            ...phases,
            [currentIndex]: currentPhase === "before" ? "after" : "before",
          }));
        }
      }, delay);

      return () => window.clearTimeout(timer);
    }, [currentIndex, currentPhase, handleNext, images, isDragging]);

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
      if (images.length <= 1) return;
      dragStartX.current = event.clientX;
      setIsDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
      if (dragStartX.current === null) return;
      const nextOffset = Math.max(-90, Math.min(90, event.clientX - dragStartX.current));
      setDragOffset(nextOffset);
    };

    const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
      if (dragStartX.current === null) return;
      const finalOffset = event.clientX - dragStartX.current;
      dragStartX.current = null;
      setIsDragging(false);
      setDragOffset(0);
      if (Math.abs(finalOffset) < 38) return;
      if (finalOffset < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-full flex-col items-center justify-center overflow-x-hidden text-foreground",
          variant === "hero" && "bg-background",
          variant === "hero" ? "min-h-screen p-4" : "min-h-0 px-0 py-0",
          className,
        )}
        {...props}
      >
        <div className={cn("z-10 flex h-full w-full flex-col items-center text-center", variant === "hero" ? "space-y-8 md:space-y-12" : "space-y-2")}>
          {(title || subtitle) && (
            <div className={cn("space-y-2", variant === "hero" && "space-y-4")}>
              {title ? (
                <h1 className={cn("mx-auto max-w-4xl font-bold", variant === "hero" ? "text-4xl sm:text-5xl md:text-6xl" : "text-sm")}>
                  {title}
                </h1>
              ) : null}
              {subtitle ? (
                <p className={cn("mx-auto max-w-2xl text-muted", variant === "hero" ? "md:text-xl" : "text-xs leading-5")}>{subtitle}</p>
              ) : null}
            </div>
          )}

          <div
            className={cn(
              "relative flex w-full touch-pan-y items-center justify-center",
              variant === "hero" ? "h-[350px] md:h-[450px]" : "h-full min-h-0",
            )}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
          >
            <div className="relative flex h-full w-full cursor-grab select-none items-center justify-center [perspective:1000px] active:cursor-grabbing">
              {images.map((image, index) => {
                const total = images.length;
                let position = (index - currentIndex + total) % total;
                if (position > Math.floor(total / 2)) position -= total;

                const isCenter = position === 0;
                const isAdjacent = Math.abs(position) === 1;
                const isVisible = isCenter || isAdjacent;
                const cardPhase = isCenter ? slidePhases[index] ?? "before" : phaseHold?.index === index ? phaseHold.phase : "before";

                return (
                  <div
                    key={`${image.src}-${index}`}
                    className={cn(
                      "absolute flex items-center justify-center ease-in-out",
                      isDragging ? "transition-none" : "transition-all duration-[800ms]",
                      variant === "hero"
                        ? "h-96 w-48 md:h-[450px] md:w-64"
                        : "w-[min(calc(100%-2.5rem),calc(35svh+45px),22rem)]",
                    )}
                    style={{
                      transform: `translateX(calc(${position * 45}% + ${dragOffset}px)) scale(${isCenter ? 1 : isAdjacent ? 0.85 : 0.7}) rotateY(${position * -10}deg)`,
                      zIndex: isCenter ? 10 : isAdjacent ? 5 : 1,
                      opacity: isCenter ? 1 : isAdjacent ? 0.38 : 0,
                      filter: "blur(0px)",
                      visibility: Math.abs(position) > 1 ? "hidden" : "visible",
                    }}
                  >
                    {isCenter ? (
                      <div
                        aria-hidden="true"
                        className="absolute inset-x-7 -bottom-4 h-14 rounded-full bg-[rgba(23,20,17,0.24)] blur-2xl"
                      />
                    ) : null}
                    {image.beforeSrc ? (
                      <div className={cn("relative w-full overflow-hidden rounded-[var(--radius-2xl)] border border-foreground/10 bg-surface", variant === "hero" ? "h-full" : "aspect-[242/398]")}>
                        <div className={cn("absolute inset-0", isVisible && "ovala-carousel-image-active")}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={image.beforeSrc} alt={image.beforeAlt || ""} className="absolute inset-0 h-full w-full object-cover" />
                          <div
                            className={cn(
                              "absolute inset-0 transition-[clip-path,opacity,filter] duration-[1200ms] ease-out",
                              cardPhase === "after"
                                ? "opacity-100 blur-0 [clip-path:inset(0_0_0_0)]"
                                : "opacity-90 blur-[1px] [clip-path:inset(0_0_0_100%)]",
                            )}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={image.src} alt={image.alt} className="h-full w-full object-cover" />
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />
                        <div
                          aria-hidden="true"
                          className={cn(
                            "pointer-events-none absolute inset-y-0 left-0 w-full transition-transform duration-[1200ms] ease-out",
                            cardPhase === "after" && isCenter ? "translate-x-0" : "translate-x-full",
                          )}
                        >
                          <span className="absolute bottom-8 left-0 top-8 w-px bg-gradient-to-b from-transparent via-white/95 to-transparent shadow-[0_0_22px_rgba(255,255,255,0.9)]" />
                        </div>
                        <span
                          className={cn(
                            "absolute right-2 top-2 rounded-full px-2 py-1 text-[10px] font-semibold shadow-sm backdrop-blur transition-colors duration-500",
                            cardPhase === "after" && isCenter ? "bg-white/84 text-navy-950" : "bg-black/48 text-white",
                          )}
                        >
                          {cardPhase === "after" && isCenter ? "بعد" : "قبل"}
                        </span>
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image.src}
                        alt={image.alt}
                        className={cn(
                          "relative w-full rounded-[var(--radius-2xl)] border border-foreground/10 object-cover",
                          variant === "hero" ? "h-full" : "aspect-[242/398]",
                          isVisible && "ovala-carousel-image-active",
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>
    );
  },
);

FeatureCarousel.displayName = "FeatureCarousel";
