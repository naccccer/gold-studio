export default function AdminProjectsLoading() {
  return (
    <div className="space-y-5" aria-label="در حال بارگذاری پروژه‌ها" aria-busy="true">
      <div className="space-y-2">
        <div className="h-7 w-32 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }, (_, index) => (
          <span key={index} className="h-8 w-20 animate-pulse rounded-full bg-slate-100" />
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0">
            <span className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-slate-100" />
            <span className="h-4 w-44 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
