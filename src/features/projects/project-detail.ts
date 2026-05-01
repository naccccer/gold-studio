import {
  completedResult,
  failedResult,
  pendingResult,
  resultHeroDark,
  uploadPreview,
} from "@/lib/placeholders/jewelry-images";

export type ProjectStatus = "completed" | "pending" | "failed";

export type ProjectDetail = {
  id: string;
  title: string;
  styleLabel: string;
  status: ProjectStatus;
  createdAt: string;
  resultImageUrl?: string | null;
  sourceImageUrl?: string | null;
  uploadPreviewUrl?: string | null;
};

const mockProjects: ProjectDetail[] = [
  {
    id: "atelier-noir-01",
    title: "آتلیه نوآر",
    styleLabel: "جواهری ادیتوریال مینیمال",
    status: "completed",
    createdAt: "2026-04-29T18:30:00.000Z",
    resultImageUrl: completedResult,
    sourceImageUrl: uploadPreview,
    uploadPreviewUrl: uploadPreview,
  },
  {
    id: "atelier-noir-02",
    title: "ادیشن شب",
    styleLabel: "نور نرم با پس‌زمینه تیره",
    status: "pending",
    createdAt: "2026-04-30T09:15:00.000Z",
    resultImageUrl: null,
    sourceImageUrl: null,
    uploadPreviewUrl: uploadPreview,
  },
  {
    id: "atelier-noir-03",
    title: "فریم ویترین",
    styleLabel: "تمرکز روی درخشش سنگ",
    status: "failed",
    createdAt: "2026-04-27T11:40:00.000Z",
    resultImageUrl: null,
    sourceImageUrl: uploadPreview,
    uploadPreviewUrl: uploadPreview,
  },
];

export async function getProjectDetail(projectId: string) {
  return mockProjects.find((project) => project.id === projectId) ?? null;
}

export function resolveResultImage(project: ProjectDetail) {
  if (project.resultImageUrl) {
    return project.resultImageUrl;
  }

  if (project.status === "failed") {
    return failedResult;
  }

  if (project.status === "pending") {
    return pendingResult;
  }

  return resultHeroDark;
}

export function resolveSourceImage(project: ProjectDetail) {
  return project.sourceImageUrl || project.uploadPreviewUrl || uploadPreview;
}

export function getStatusCopy(status: ProjectStatus) {
  switch (status) {
    case "completed":
      return {
        label: "آماده دریافت",
        description: "نسخه نهایی با نور، کنتراست و حس استودیویی آماده است.",
      };
    case "pending":
      return {
        label: "در حال آماده‌سازی",
        description: "خروجی در حال نهایی شدن است و به‌زودی برای دریافت آماده می‌شود.",
      };
    case "failed":
      return {
        label: "نیاز به تلاش دوباره",
        description: "این خروجی کامل نشد، اما می‌توانید با همان مسیر یک نسخه بهتر بسازید.",
      };
    default:
      return {
        label: "نامشخص",
        description: "",
      };
  }
}

export function formatProjectDate(date: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function getKnownProjectIds() {
  return mockProjects.map((project) => project.id);
}

