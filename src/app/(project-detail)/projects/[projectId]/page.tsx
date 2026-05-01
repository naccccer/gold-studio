import { notFound } from "next/navigation";
import { ResultReveal } from "@/features/projects/result-reveal";
import { getProjectDetail, getKnownProjectIds } from "@/features/projects/project-detail";

type ProjectDetailPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function generateStaticParams() {
  return getKnownProjectIds().map((projectId) => ({ projectId }));
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { projectId } = await params;
  const project = await getProjectDetail(projectId);

  if (!project) {
    notFound();
  }

  return <ResultReveal project={project} />;
}

