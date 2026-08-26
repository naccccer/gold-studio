"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { isWebVitalName } from "@/lib/web-vitals";

const configuredSampleRate = Number.parseFloat(process.env.NEXT_PUBLIC_WEB_VITALS_SAMPLE_RATE ?? "0.2");
const sampleRate = Number.isFinite(configuredSampleRate) ? Math.min(1, Math.max(0, configuredSampleRate)) : 0.2;

export function WebVitalsReporter() {
  const pathname = usePathname();
  const sampled = useRef(false);

  useEffect(() => {
    sampled.current = Math.random() < sampleRate;
  }, []);

  const report = useCallback(
    (metric: { id: string; name: string; value: number; delta: number; rating: string; navigationType: string }) => {
      if (!isWebVitalName(metric.name) || !sampled.current) return;

      const body = JSON.stringify({
        id: metric.id,
        name: metric.name,
        value: metric.value,
        delta: metric.delta,
        rating: metric.rating,
        navigationType: metric.navigationType,
        path: pathname || "/",
      });

      if (navigator.sendBeacon) {
        const queued = navigator.sendBeacon("/api/metrics/web-vitals", new Blob([body], { type: "application/json" }));
        if (queued) return;
      }

      void fetch("/api/metrics/web-vitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
    },
    [pathname],
  );

  useReportWebVitals(report);
  return null;
}
