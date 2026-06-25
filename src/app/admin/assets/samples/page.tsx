import Image from "next/image";
import Link from "next/link";
import { DocumentUpload, Trash } from "vuesax-icons-react";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  ConsoleHeader,
  EmptyState,
  faNum,
  fieldClass,
  formatAdminFullDate,
  inlineFieldClass,
  Surface,
  TabNav,
} from "@/features/admin/components/console";
import {
  deleteReadyStyleReferenceSampleAction,
  uploadReadyStyleReferenceSampleAction,
} from "@/features/admin/actions";
import { requireAdminSession } from "@/lib/auth/session";
import { getReadyStyleReferenceSamples } from "@/lib/ready-style-reference-samples";
import { getVerticalLabel, normalizeUserVisibleVerticalId, USER_VISIBLE_VERTICAL_IDS, VERTICALS } from "@/lib/verticals";

export const dynamic = "force-dynamic";

type AdminReadySamplesPageProps = {
  searchParams?: Promise<{ error?: string; vertical?: string }>;
};

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024)).toLocaleString("fa-IR")} KB`;
}

export default async function AdminReadySamplesPage({ searchParams }: AdminReadySamplesPageProps) {
  await requireAdminSession();

  const params = await searchParams;
  const vertical = normalizeUserVisibleVerticalId(params?.vertical);
  const samples = await getReadyStyleReferenceSamples(vertical);
  const samplesHref = (nextVertical = vertical) => `/admin/assets/samples?vertical=${nextVertical}`;

  return (
    <>
      <ConsoleHeader
        title="نمونه‌های آماده"
        meta={<span>{faNum(samples.length)} نمونه عمومی برای {getVerticalLabel(vertical)}</span>}
      />

      <TabNav
        tabs={[
          { href: `/admin/assets?vertical=${vertical}`, label: "تصاویر منبع کاربران", active: false },
          { href: `/admin/assets/references?vertical=${vertical}`, label: "عکس‌های نمونه کاربران", active: false },
          { href: samplesHref(), label: "نمونه‌های آماده", active: true, count: samples.length },
          { href: `/admin/assets/outputs?vertical=${vertical}`, label: "خروجی‌ها", active: false },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2">
        {USER_VISIBLE_VERTICAL_IDS.map((item) => (
          <Link key={item} href={samplesHref(item)} className={`${item === vertical ? btnPrimary : btnSecondary} h-8`}>
            {VERTICALS[item].label}
          </Link>
        ))}
      </div>

      <Surface className="p-4">
        <form action={uploadReadyStyleReferenceSampleAction} className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)_auto] sm:items-end">
          <label className="grid gap-1.5 text-xs font-medium text-slate-600">
            Vertical
            <select name="vertical" defaultValue={vertical} className={inlineFieldClass}>
              {USER_VISIBLE_VERTICAL_IDS.map((item) => (
                <option key={item} value={item}>
                  {VERTICALS[item].label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-slate-600">
            آپلود نمونه آماده
            <input name="image" type="file" accept="image/jpeg,image/png,image/webp" required className={fieldClass} />
          </label>
          <button className={`${btnPrimary} h-9`}>
            <DocumentUpload aria-hidden="true" className="h-4 w-4" />
            آپلود و تبدیل
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
                    <span>{getVerticalLabel(sample.vertical)}</span>
                  </div>
                  <p className="truncate text-[11px] text-slate-400">{formatAdminFullDate(sample.updatedAt)}</p>
                  <form action={deleteReadyStyleReferenceSampleAction} className="border-t border-slate-100 pt-2">
                    <input type="hidden" name="sampleId" value={sample.id} />
                    <input type="hidden" name="vertical" value={vertical} />
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
