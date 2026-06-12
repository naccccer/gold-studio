"use client";

import { useMemo, useState } from "react";
import { Copy, TickCircle } from "vuesax-icons-react";
import { btnSecondary } from "@/features/admin/components/console";

export function CopySalesCodesButton({ codes }: { codes: string[] }) {
  const [copied, setCopied] = useState(false);
  const copyText = useMemo(() => codes.join("\n"), [codes]);

  async function handleCopy() {
    if (!copyText) return;

    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={codes.length === 0}
      className={`${btnSecondary} disabled:cursor-not-allowed disabled:opacity-50`}
      aria-label={copied ? "کدها کپی شد" : "کپی کدهای مصرف‌نشده"}
    >
      {copied ? <TickCircle aria-hidden="true" className="h-3.5 w-3.5" /> : <Copy aria-hidden="true" className="h-3.5 w-3.5" />}
      {copied ? "کپی شد" : "کپی همه"}
    </button>
  );
}
