"use client";

import type { ImageProvider } from "@/lib/ai/provider";

export function ProviderSwitch({ selectedProvider }: { selectedProvider: ImageProvider }) {
  return (
    <div className="grid min-w-0 gap-1.5">
      <p className="text-xs font-medium text-muted">Provider فعال</p>
      <div className="grid grid-cols-2 gap-2 rounded-[var(--radius-md)] border border-border/70 bg-surface-soft/45 p-1.5">
        {[
          { value: "liara", label: "Liara", hint: "مسیر اصلی" },
          { value: "avalai", label: "Avalai", hint: "تست 2K" },
        ].map((item) => (
          <label key={item.value} className="cursor-pointer">
            <input
              type="radio"
              name="imageProvider"
              value={item.value}
              defaultChecked={selectedProvider === item.value}
              className="peer sr-only"
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
            />
            <span className="grid gap-0.5 rounded-[var(--radius-sm)] border border-transparent px-2.5 py-2 text-xs text-muted transition hover:bg-surface/70 hover:text-foreground peer-checked:border-foreground peer-checked:bg-surface peer-checked:text-foreground peer-checked:shadow-[var(--shadow-soft)]">
              <span className="font-semibold" dir="ltr">
                {item.label}
              </span>
              <span>{item.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
