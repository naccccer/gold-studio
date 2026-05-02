"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type ProjectStatusRefreshProps = {
  active: boolean;
};

export function ProjectStatusRefresh({ active }: ProjectStatusRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (!active) {
      return;
    }

    const intervalId = window.setInterval(() => {
      router.refresh();
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [active, router]);

  return null;
}
