"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft2, ArrowRight2, CloseCircle, ExportSquare } from "vuesax-icons-react";

type PreviewItem = {
  element: HTMLImageElement;
  src: string;
  label: string;
  detailHref: string | null;
};

type PreviewState = {
  items: PreviewItem[];
  index: number;
};

const previewImageSelector = "img:not([data-admin-image-preview-disabled])";

function imageLabel(image: HTMLImageElement) {
  const figureCaption = image.closest("figure")?.querySelector("figcaption")?.textContent?.trim();
  const linkedLabel = image.closest("a")?.getAttribute("aria-label")?.trim();

  return image.alt.trim() || figureCaption || linkedLabel || image.title.trim() || "تصویر";
}

function originalImageUrl(image: HTMLImageElement) {
  const displayedUrl = image.currentSrc || image.src;

  try {
    const parsedUrl = new URL(displayedUrl, window.location.href);
    const optimizedSource = parsedUrl.pathname === "/_next/image" ? parsedUrl.searchParams.get("url") : null;
    return optimizedSource ? new URL(optimizedSource, window.location.href).href : parsedUrl.href;
  } catch {
    return displayedUrl;
  }
}

function collectPreviewItems(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLImageElement>(previewImageSelector))
    .filter((image) => Boolean(image.currentSrc || image.src) && image.getClientRects().length > 0)
    .map((image) => ({
      element: image,
      src: originalImageUrl(image),
      label: imageLabel(image),
      detailHref: image.closest<HTMLAnchorElement>("a[href]")?.href ?? null,
    }));
}

function imageFromEventTarget(target: EventTarget | null, root: HTMLElement) {
  if (!(target instanceof HTMLElement)) return null;
  if (target.matches(previewImageSelector)) return target as HTMLImageElement;

  let current: HTMLElement | null = target;
  while (current && current !== root) {
    const directImage = Array.from(current.children).find(
      (child): child is HTMLImageElement => child instanceof HTMLImageElement && child.matches(previewImageSelector),
    );
    if (directImage) return directImage;
    if (current.matches("a, button, label")) break;
    current = current.parentElement;
  }

  return null;
}

function openPreview(root: HTMLElement, image: HTMLImageElement, setPreview: (preview: PreviewState) => void) {
  const items = collectPreviewItems(root);
  const index = items.findIndex((item) => item.element === image);
  if (index < 0) return;
  setPreview({ items, index });
}

export function AdminImageLightbox() {
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const isOpen = preview !== null;

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-admin-image-preview-root]");
    if (!root) return;

    const enhanceImages = () => {
      root.querySelectorAll<HTMLImageElement>(previewImageSelector).forEach((image) => {
        if (image.closest("a, button, label")) return;
        image.tabIndex = 0;
        image.setAttribute("role", "button");
        image.setAttribute("aria-label", `نمایش کامل ${imageLabel(image)}`);
      });
    };

    const handleClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const image = imageFromEventTarget(event.target, root);
      if (!image) return;

      event.preventDefault();
      triggerRef.current = image.closest<HTMLElement>("a, button") ?? image;
      openPreview(root, image, setPreview);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (!(event.target instanceof HTMLImageElement) || !event.target.matches(previewImageSelector)) return;

      event.preventDefault();
      triggerRef.current = event.target;
      openPreview(root, event.target, setPreview);
    };

    enhanceImages();
    const observer = new MutationObserver(enhanceImages);
    observer.observe(root, { childList: true, subtree: true });
    root.addEventListener("click", handleClick);
    root.addEventListener("keydown", handleKeyDown);

    return () => {
      observer.disconnect();
      root.removeEventListener("click", handleClick);
      root.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setPreview(null);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setPreview((current) =>
          current && current.items.length > 1 ? { ...current, index: (current.index + 1) % current.items.length } : current,
        );
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setPreview((current) =>
          current && current.items.length > 1
            ? { ...current, index: (current.index - 1 + current.items.length) % current.items.length }
            : current,
        );
        return;
      }

      if (event.key === "Tab") {
        const dialog = closeButtonRef.current?.closest<HTMLElement>("[role='dialog']");
        const focusable = dialog
          ? Array.from(dialog.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"))
          : [];
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (dialog && !dialog.contains(document.activeElement)) {
          event.preventDefault();
          first.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      triggerRef.current?.focus();
    };
  }, [isOpen]);

  if (!preview) return null;

  const activeItem = preview.items[preview.index];
  const hasMultipleImages = preview.items.length > 1;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex bg-navy-950/95 text-white"
      role="dialog"
      aria-modal="true"
      aria-label={`نمایش کامل ${activeItem.label}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setPreview(null);
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 bg-gradient-to-b from-black/60 to-transparent px-3 pb-10 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{activeItem.label}</p>
          {hasMultipleImages ? (
            <p className="mt-0.5 text-[11px] text-white/65" aria-live="polite">
              تصویر {new Intl.NumberFormat("fa-IR").format(preview.index + 1)} از {new Intl.NumberFormat("fa-IR").format(preview.items.length)}
            </p>
          ) : null}
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={() => setPreview(null)}
          className="pointer-events-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-[background-color,transform] duration-150 hover:bg-white/20 active:scale-[0.97]"
          aria-label="بستن نمایش کامل تصویر"
        >
          <CloseCircle aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>

      <div
        className="flex min-h-0 w-full items-center justify-center overflow-auto p-3 pb-20 pt-20 sm:p-8 sm:pb-20 sm:pt-20"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) setPreview(null);
        }}
      >
        {/* The original asset URL is intentional here; the lightbox must not request a thumbnail-sized optimized source. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={activeItem.src}
          src={activeItem.src}
          alt={activeItem.label}
          className="block max-h-full max-w-full object-contain"
        />
      </div>

      {hasMultipleImages ? (
        <>
          <button
            type="button"
            onClick={() => setPreview((current) => current && ({ ...current, index: (current.index - 1 + current.items.length) % current.items.length }))}
            className="absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-[background-color,transform] duration-150 hover:bg-white/20 active:scale-[0.97] sm:right-5"
            aria-label="تصویر قبلی"
          >
            <ArrowRight2 aria-hidden="true" className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setPreview((current) => current && ({ ...current, index: (current.index + 1) % current.items.length }))}
            className="absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-[background-color,transform] duration-150 hover:bg-white/20 active:scale-[0.97] sm:left-5"
            aria-label="تصویر بعدی"
          >
            <ArrowLeft2 aria-hidden="true" className="h-5 w-5" />
          </button>
        </>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/65 to-transparent px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-10">
        <a
          href={activeItem.src}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center gap-2 rounded-full bg-white/10 px-3 text-xs font-medium text-white transition-[background-color,transform] duration-150 hover:bg-white/20 active:scale-[0.97]"
        >
          <ExportSquare aria-hidden="true" className="h-4 w-4" />
          فایل اصلی
        </a>
        {activeItem.detailHref ? (
          <a
            href={activeItem.detailHref}
            className="inline-flex h-9 items-center rounded-full bg-white px-3 text-xs font-semibold text-navy-950 transition-[background-color,transform] duration-150 hover:bg-navy-50 active:scale-[0.97]"
          >
            مشاهده جزئیات
          </a>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
