"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { Add } from "vuesax-icons-react";
import { btnSecondary } from "@/features/admin/components/console";

type StylePreviewUploadFieldProps = {
  name?: string;
  currentImageUrl: string;
  fallbackImageUrl: string;
  imageAlt: string;
  hiddenUrlName?: string;
  hiddenUrlValue: string;
  currentUrlName?: string;
  required?: boolean;
  layout?: "inline" | "stacked";
};

export function StylePreviewUploadField({
  name = "previewImage",
  currentImageUrl,
  fallbackImageUrl,
  imageAlt,
  hiddenUrlName = "previewImageUrl",
  hiddenUrlValue,
  currentUrlName = "currentPreviewImageUrl",
  required = false,
  layout = "inline",
}: StylePreviewUploadFieldProps) {
  const inputId = useId();
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | null>(null);
  const displayUrl = selectedPreviewUrl || currentImageUrl || fallbackImageUrl;

  useEffect(() => {
    return () => {
      if (selectedPreviewUrl) {
        URL.revokeObjectURL(selectedPreviewUrl);
      }
    };
  }, [selectedPreviewUrl]);

  return (
    <div className="grid gap-2">
      <input type="hidden" name={hiddenUrlName} value={hiddenUrlValue} />
      <input type="hidden" name={currentUrlName} value={currentImageUrl} />

      <div className={`grid gap-3 ${layout === "inline" ? "sm:grid-cols-[168px_minmax(0,1fr)] sm:items-start" : ""}`}>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <div className="relative aspect-[4/3]">
            <Image
              src={displayUrl}
              alt={imageAlt}
              fill
              unoptimized
              className="object-cover"
              sizes={layout === "inline" ? "168px" : "220px"}
            />
          </div>
        </div>

        <div className={`grid min-w-0 content-start gap-2 ${layout === "stacked" ? "justify-items-start" : ""}`}>
          <input
            id={inputId}
            name={name}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required={required}
            className="sr-only"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0] ?? null;
              setSelectedPreviewUrl((previousUrl) => {
                if (previousUrl) {
                  URL.revokeObjectURL(previousUrl);
                }

                return file ? URL.createObjectURL(file) : null;
              });
            }}
          />
          <label htmlFor={inputId} className={`${btnSecondary} w-fit`}>
            <Add className="h-4 w-4" />
            انتخاب تصویر
          </label>
          <p className="text-[11px] text-slate-400" dir="ltr">
            JPG / PNG / WEBP · max 10MB
          </p>
        </div>
      </div>
    </div>
  );
}
