"use client";

import { useState } from "react";
import { Copy, TickCircle } from "vuesax-icons-react";

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
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-soft text-foreground shadow-[0_12px_24px_-20px_rgba(17,16,14,0.65),inset_0_1px_0_rgba(255,255,255,0.75)] transition hover:bg-surface focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
      onClick={handleCopy}
      aria-label={copied ? "شماره کارت کپی شد" : "کپی شماره کارت"}
      title={copied ? "کپی شد" : "کپی شماره کارت"}
    >
      {copied ? <TickCircle aria-hidden={true} className="h-4 w-4" /> : <Copy aria-hidden={true} className="h-4 w-4" />}
    </button>
  );
}
