import { Images } from "lucide-react";
import { Surface } from "@/components/ui/surface";

export type AdminProjectListItem = {
  id: string;
  title: string | null;
  status: string;
  style: { name: string };
  createdAt: Date;
  user: {
    email: string;
    name: string | null;
  };
};

type AdminProjectsScreenProps = {
  projects: AdminProjectListItem[];
};

const dateFormatter = new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "short" });

export function AdminProjectsScreen({ projects }: AdminProjectsScreenProps) {
  return (
    <Surface padding="lg">
      <div className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
          <Images aria-hidden="true" className="h-4 w-4" />
          پروژه‌ها
        </h2>
        <span className="text-xs text-muted">{projects.length.toLocaleString("fa-IR")} مورد اخیر</span>
      </div>

      <div className="mt-4 space-y-3">
        {projects.length === 0 ? (
          <p className="text-sm text-muted">هنوز پروژه‌ای ثبت نشده است.</p>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="rounded-[var(--radius-md)] border border-border/70 bg-surface-soft/35 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{project.title || "پروژه بدون عنوان"}</p>
                  <p className="mt-1 truncate text-xs text-muted" dir="ltr">
                    {project.user.name || project.user.email}
                  </p>
                </div>
                <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-[10px] text-muted">
                  {project.status}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted">
                {project.style.name}
                <span className="px-1">·</span>
                {dateFormatter.format(project.createdAt)}
              </p>
            </div>
          ))
        )}
      </div>
    </Surface>
  );
}
