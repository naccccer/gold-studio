"use client";

import { useState } from "react";
import { Copy, CheckCircle } from "lucide-react";

export function CopyCardNumberButton({ cardNumber }: { cardNumber: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(cardNumber.replace(/\D/g, ""));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      className="ov-press inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-hairline bg-surface text-ink-1 shadow-[var(--shadow-xs)] transition hover:bg-surface-soft focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
      onClick={handleCopy}
      aria-label={copied ? "شماره کارت کپی شد" : "کپی شماره کارت"}
      title={copied ? "کپی شد" : "کپی شماره کارت"}
    >
      {copied ? <CheckCircle aria-hidden={true} className="h-4 w-4 text-champagne-600" /> : <Copy aria-hidden={true} className="h-4 w-4" />}
    </button>
  );
}
