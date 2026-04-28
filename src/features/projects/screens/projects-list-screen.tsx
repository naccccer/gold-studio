import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { STYLE_PRESETS, type StylePresetId } from "@/features/projects/presets";

const styleLabelMap = new Map(STYLE_PRESETS.map((item) => [item.id, item.label]));

export type ProjectListItem = {
  id: string;
  title: string | null;
  status: string;
  stylePreset: StylePresetId;
};

type ProjectsListScreenProps = {
  projects: ProjectListItem[];
};

export function ProjectsListScreen({ projects }: ProjectsListScreenProps) {
  return (
    <PageShell>
      <Surface padding="lg" className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Ù¾Ø±ÙˆÚ˜Ù‡â€ŒÙ‡Ø§ÛŒ Ù…Ù†</h2>
          <p className="mt-1 text-sm text-slate-600">ÙˆØ¶Ø¹ÛŒØª ØªÙˆÙ„ÛŒØ¯ Ùˆ Ø®Ø±ÙˆØ¬ÛŒ Ù‡Ø± Ù¾Ø±ÙˆÚ˜Ù‡ Ø±Ø§ Ø§ÛŒÙ†Ø¬Ø§ Ø¨Ø¨ÛŒÙ†ÛŒØ¯.</p>
        </div>
        <ButtonLink href="/projects/new" size="sm">
          Ù¾Ø±ÙˆÚ˜Ù‡ Ø¬Ø¯ÛŒØ¯
        </ButtonLink>
      </Surface>

      <div className="space-y-3">
        {projects.length === 0 ? (
          <Surface padding="lg" className="text-sm text-slate-600">
            Ù‡Ù†ÙˆØ² Ù¾Ø±ÙˆÚ˜Ù‡â€ŒØ§ÛŒ Ù†Ø¯Ø§Ø±ÛŒØ¯.
          </Surface>
        ) : null}

        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="block rounded-3xl border border-slate-200 bg-white p-4 transition hover:border-amber-300"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-slate-900">{project.title || "Ø¨Ø¯ÙˆÙ† Ø¹Ù†ÙˆØ§Ù†"}</p>
              <StatusPill>{project.status}</StatusPill>
            </div>
            <p className="mt-2 text-xs text-slate-500">Ø³Ø¨Ú©: {styleLabelMap.get(project.stylePreset) ?? project.stylePreset}</p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
