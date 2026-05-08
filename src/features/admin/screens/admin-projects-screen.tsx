import { AlertTriangle, CheckCircle2, Clock3, Images, LoaderCircle } from "lucide-react";
import { Surface } from "@/components/ui/surface";
import { getUserDisplayName } from "@/lib/auth/user-identity";

export type AdminProjectListItem = {
  id: string;
  title: string | null;
  status: string;
  style: { name: string };
  createdAt: Date;
  user: {
    email: string | null;
    phone: string | null;
    name: string | null;
  };
};

type AdminProjectsScreenProps = {
  projects: AdminProjectListItem[];
};

const dateFormatter = new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const statusMap: Record<string, { label: string; className: string; icon: typeof Clock3 }> = {
  QUEUED: { label: "در صف", className: "border-amber-200 bg-amber-50 text-amber-800", icon: Clock3 },
  PROCESSING: { label: "در حال پردازش", className: "border-sky-200 bg-sky-50 text-sky-800", icon: LoaderCircle },
  COMPLETED: { label: "تکمیل شده", className: "border-emerald-200 bg-emerald-50 text-emerald-800", icon: CheckCircle2 },
  FAILED: { label: "ناموفق", className: "border-rose-200 bg-rose-50 text-rose-700", icon: AlertTriangle },
};

export function AdminProjectsScreen({ projects }: AdminProjectsScreenProps) {
  const counts = {
    queued: projects.filter((p) => p.status === "QUEUED").length,
    processing: projects.filter((p) => p.status === "PROCESSING").length,
    completed: projects.filter((p) => p.status === "COMPLETED").length,
    failed: projects.filter((p) => p.status === "FAILED").length,
  };

  return (
    <section className="space-y-4">
      <Surface padding="lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
            <Images aria-hidden={true} className="h-4 w-4" />
            پروژه‌ها
          </h2>
          <span className="text-xs text-muted">{projects.length.toLocaleString("fa-IR")} پروژه اخیر</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
          <div className="rounded-[0.9rem] border border-border/70 bg-surface-soft px-3 py-2">در صف: {counts.queued.toLocaleString("fa-IR")}</div>
          <div className="rounded-[0.9rem] border border-border/70 bg-surface-soft px-3 py-2">در حال پردازش: {counts.processing.toLocaleString("fa-IR")}</div>
          <div className="rounded-[0.9rem] border border-border/70 bg-surface-soft px-3 py-2">تکمیل: {counts.completed.toLocaleString("fa-IR")}</div>
          <div className="rounded-[0.9rem] border border-border/70 bg-surface-soft px-3 py-2">ناموفق: {counts.failed.toLocaleString("fa-IR")}</div>
        </div>
      </Surface>

      <Surface padding="lg">
        <div className="space-y-2">
          {projects.length === 0 ? (
            <p className="text-sm text-muted">هنوز پروژه‌ای ثبت نشده است.</p>
          ) : (
            projects.map((project) => {
              const status = statusMap[project.status] ?? {
                label: project.status,
                className: "border-border bg-surface text-muted",
                icon: Clock3,
              };
              const StatusIcon = status.icon;

              return (
                <div key={project.id} className="grid gap-2 rounded-[0.9rem] border border-border/70 bg-surface-soft/45 p-3 text-xs md:grid-cols-[1.3fr_1fr_auto] md:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{project.title || "پروژه بدون عنوان"}</p>
                    <p className="truncate text-muted" dir="ltr">
                      {getUserDisplayName(project.user)}
                    </p>
                  </div>
                  <div className="text-muted">
                    <p className="truncate">{project.style.name}</p>
                    <p>{dateFormatter.format(project.createdAt)}</p>
                  </div>
                  <span className={`inline-flex w-fit items-center gap-1 rounded-full border px-2 py-1 text-[10px] ${status.className}`}>
                    <StatusIcon aria-hidden={true} className="h-3 w-3" />
                    {status.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </Surface>
    </section>
  );
}
