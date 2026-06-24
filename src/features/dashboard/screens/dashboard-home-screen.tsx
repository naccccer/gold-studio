import { Add } from "vuesax-icons-react";
import { FeatureCarousel } from "@/components/feature-carousel";
import { ButtonLink } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";
import type { HomeCarouselImage } from "@/lib/home-carousel";
import type { VerticalContent } from "@/lib/vertical-content";

export type DashboardRecentProject = {
  id: string;
  title: string | null;
  status: string;
  style: { name: string };
  sourceImageUrl: string;
  resultImageUrl?: string | null;
  createdAt: Date;
};

type DashboardHomeScreenProps = {
  userName?: string | null;
  projectCount: number;
  completedCount: number;
  recentProjects: DashboardRecentProject[];
  carouselImages: HomeCarouselImage[];
  content: VerticalContent;
};

export function DashboardHomeScreen({ carouselImages, content }: DashboardHomeScreenProps) {
  return (
    <PageShell maxWidth="lg" minHeight={false} className="min-h-0 flex-1 pb-[calc(env(safe-area-inset-bottom)+6.2rem)]">
      <section className="flex min-h-0 flex-1 flex-col">
        <FeatureCarousel
          variant="compact"
          images={carouselImages}
          className="min-h-0 flex-1 bg-transparent"
        />

        <ButtonLink href="/projects/new" size="full" className="mt-2 h-12 shrink-0 rounded-[1rem] text-sm">
          <Add aria-hidden="true" className="h-4 w-4" />
          {content.productName === "غذا یا نوشیدنی" ? "پروژه غذایی جدید" : "پروژه جدید"}
        </ButtonLink>

      </section>
    </PageShell>
  );
}
