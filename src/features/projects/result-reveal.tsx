import Image from "next/image";
import Link from "next/link";
import type { ProjectDetail } from "@/features/projects/project-detail";
import {
  formatProjectDate,
  getStatusCopy,
  resolveResultImage,
  resolveSourceImage,
} from "@/features/projects/project-detail";

type ResultRevealProps = {
  project: ProjectDetail;
};

export function ResultReveal({ project }: ResultRevealProps) {
  const resultImage = resolveResultImage(project);
  const sourceImage = resolveSourceImage(project);
  const statusCopy = getStatusCopy(project.status);
  const isCompleted = project.status === "completed";
  const headline =
    project.status === "failed"
      ? "این فریم نیاز به یک برداشت دوباره دارد"
      : project.status === "pending"
        ? "پرداخت نهایی این فریم در حال تکمیل است"
        : "فریم نهایی شما آماده‌ی ارائه است";
  const description =
    project.status === "failed"
      ? "خروجی فعلی آرام و قابل بازبینی نگه داشته شده تا بتوانید با یک ورودی تازه، نسخه بهتری بسازید."
      : project.status === "pending"
        ? "نور، بافت و بازتاب‌ها در حال جمع‌بندی هستند و همین صفحه به‌زودی نسخه نهایی را نمایش می‌دهد."
        : "نتیجه با تمرکز روی درخشش فلز، وضوح سنگ و حس استودیویی جمع‌بندی شده تا برای ویترین، فروش و انتشار آماده باشد.";
  const metadata = [
    project.styleLabel,
    formatProjectDate(project.createdAt),
    statusCopy.label,
  ];

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-4 text-stone-100 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col justify-between overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(232,201,154,0.16),_transparent_30%),linear-gradient(180deg,_#161312_0%,_#090909_44%,_#050505_100%)] shadow-[0_32px_120px_-48px_rgba(0,0,0,0.95)]">
        <header className="flex items-center justify-between gap-4 px-5 py-5 sm:px-7">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-stone-300 transition-colors hover:bg-white/10"
          >
            <span aria-hidden="true">←</span>
            <span>بازگشت به آرشیو</span>
          </Link>

          <div className="text-left">
            <p className="text-[0.65rem] tracking-[0.34em] text-stone-500">GOLD STUDIO</p>
            <p className="mt-1 text-sm text-stone-300">{project.title}</p>
          </div>
        </header>

        <section className="grid flex-1 gap-6 px-5 pb-5 sm:px-7 sm:pb-7 lg:grid-cols-[minmax(0,1.5fr)_20rem] lg:items-end">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs tracking-[0.3em] text-[#cfb07c]">خروجی نهایی</p>
              <h1 className="text-2xl font-medium leading-tight text-stone-50 sm:text-[2rem]">
                {headline}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-stone-400">
                {description}
              </p>
            </div>

            <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/40 shadow-[0_28px_100px_-44px_rgba(0,0,0,0.95)]">
              <div className="relative aspect-[4/5] w-full sm:aspect-[16/10]">
                <Image
                  src={resultImage}
                  alt=""
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 70vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          <aside className="flex h-full flex-col justify-end gap-4">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
              <p className="text-xs tracking-[0.22em] text-stone-500">وضعیت</p>
              <p className="mt-3 text-lg font-medium text-stone-100">{statusCopy.label}</p>
              <p className="mt-2 text-sm leading-7 text-stone-400">{statusCopy.description}</p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
              <p className="text-xs tracking-[0.22em] text-stone-500">مرجع ورودی</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="relative h-20 w-16 overflow-hidden rounded-[1rem] border border-white/10 bg-white/5">
                  <Image
                    src={sourceImage}
                    alt=""
                    fill
                    unoptimized
                    sizes="64px"
                    className="object-cover opacity-80"
                  />
                </div>
                <p className="text-sm leading-7 text-stone-400">
                  تصویر اولیه فقط برای مقایسه نگه داشته شده و نقش فرعی دارد تا تمرکز روی خروجی
                  نهایی بماند.
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[#cfb07c]/20 bg-[#171210] p-4 shadow-[0_22px_80px_-50px_rgba(232,201,154,0.55)]">
              <div className="space-y-3">
                <a
                  href={resultImage}
                  download={isCompleted ? `${project.id}-gold-studio-result.png` : undefined}
                  className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#e8c99a] px-5 text-sm font-medium text-[#1b130b] transition-transform hover:scale-[1.01]"
                >
                  {isCompleted ? "دانلود تصویر" : "خروجی نهایی"}
                </a>
                <Link
                  href="/projects/new"
                  className="inline-flex h-12 w-full items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 text-sm text-stone-200 transition-colors hover:bg-white/10"
                >
                  پروژه جدید
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-stone-400">
              {metadata.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5"
                >
                  {item}
                </span>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
