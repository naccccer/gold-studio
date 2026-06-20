import Image from "next/image";
import { DocumentUpload, Trash } from "vuesax-icons-react";
import {
  btnDanger,
  btnPrimary,
  ConsoleHeader,
  EmptyState,
  faNum,
  fieldClass,
  formatAdminFullDate,
  Surface,
  TabNav,
} from "@/features/admin/components/console";
import {
  deleteReadyStyleReferenceSampleAction,
  uploadReadyStyleReferenceSampleAction,
} from "@/features/admin/actions";
import { getReadyStyleReferenceSamples } from "@/lib/ready-style-reference-samples";

export const dynamic = "force-dynamic";

type AdminReadySamplesPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024)).toLocaleString("fa-IR")} KB`;
}

export default async function AdminReadySamplesPage({ searchParams }: AdminReadySamplesPageProps) {
  const [params, samples] = await Promise.all([searchParams, getReadyStyleReferenceSamples()]);

  return (
    <>
      <ConsoleHeader
        title="نمونه‌های آماده"
        meta={<span>{faNum(samples.length)} نمونه عمومی برای صفحه گالری نمونه‌های کاربر</span>}
      />

      <TabNav
        tabs={[
          { href: "/admin/assets", label: "تصاویر منبع کاربران", active: false },
          { href: "/admin/assets/references", label: "عکس‌های نمونه کاربران", active: false },
          { href: "/admin/assets/samples", label: "نمونه‌های آماده", active: true, count: samples.length },
          { href: "/admin/assets/outputs", label: "خروجی‌ها", active: false },
        ]}
      />

      <Surface className="p-4">
        <form action={uploadReadyStyleReferenceSampleAction} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <label className="grid gap-1.5 text-xs font-medium text-slate-600">
            آپلود نمونه آماده
            <input name="image" type="file" accept="image/jpeg,image/png,image/webp" required className={fieldClass} />
          </label>
          <button className={`${btnPrimary} h-9`}>
            <DocumentUpload aria-hidden="true" className="h-4 w-4" />
            آپلود WebP
          </button>
        </form>
        {params?.error ? <p className="mt-3 text-xs font-medium text-rose-700">{params.error}</p> : null}
      </Surface>

      {samples.length === 0 ? (
        <Surface className="p-8">
          <EmptyState title="هنوز نمونه آماده‌ای آپلود نشده است." />
        </Surface>
      ) : (
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 p-0">
          {samples.map((sample) => (
            <li key={sample.id}>
              <Surface>
                <div className="relative aspect-square bg-slate-100">
                  <Image src={sample.fileUrl} alt={sample.alt} fill unoptimized className="object-cover" sizes="180px" />
                </div>
                <div className="space-y-3 p-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-navy-950">{sample.title}</h2>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400" dir="ltr" title={sample.fileName}>
                      {sample.fileName}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[11px] text-slate-500">
                    <span>{formatBytes(sample.size)}</span>
                    <span>{formatAdminFullDate(sample.updatedAt)}</span>
                  </div>
                  <form action={deleteReadyStyleReferenceSampleAction} className="border-t border-slate-100 pt-2">
                    <input type="hidden" name="sampleId" value={sample.id} />
                    <button className={`${btnDanger} h-8 px-2.5`}>
                      <Trash aria-hidden="true" className="h-4 w-4" />
                      حذف
                    </button>
                  </form>
                </div>
              </Surface>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
