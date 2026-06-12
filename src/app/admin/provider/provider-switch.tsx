"use client";

import type { ImageProvider } from "@/lib/ai/provider";

export function ProviderSwitch({ selectedProvider }: { selectedProvider: ImageProvider }) {
  return (
    <div className="grid min-w-0 content-start gap-1.5">
      <p className="text-xs font-medium text-slate-600">Provider فعال</p>
      <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-slate-200 bg-navy-25 p-1">
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
            <span className="grid gap-0.5 rounded-md border border-transparent px-2.5 py-1.5 text-xs text-slate-500 transition hover:text-navy-900 peer-checked:border-slate-200 peer-checked:bg-white peer-checked:text-navy-950 peer-checked:shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-navy-600">
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
