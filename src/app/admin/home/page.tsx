import Image from "next/image";
import Link from "next/link";
import { Add, Save2 } from "vuesax-icons-react";
import type { HomeCarouselSlide } from "@/generated/prisma";
import { ConfirmAction } from "@/components/ui/confirm-action";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  checkboxClass,
  ConsoleHeader,
  EmptyState,
  faNum,
  Field,
  fieldClass,
  Surface,
} from "@/features/admin/components/console";
import {
  createHomeCarouselSlideAction,
  deleteHomeCarouselSlideAction,
  updateHomeCarouselSlideAction,
} from "@/features/admin/actions";
import { db } from "@/lib/db";
import { fallbackHomeCarouselImages } from "@/lib/home-carousel";
import { storageUrlFromKeyOrUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

type AdminHomePageProps = {
  searchParams?: Promise<{ slide?: string; new?: string }>;
};

export default async function AdminHomePage({ searchParams }: AdminHomePageProps) {
  const params = await searchParams;
  const slides = await db.homeCarouselSlide.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  const creating = params?.new === "1" || slides.length === 0;
  const selected = creating ? null : slides.find((slide) => slide.id === params?.slide) ?? slides[0] ?? null;
  const activeCount = slides.filter((slide) => slide.isActive).length;

  return (
    <>
      <ConsoleHeader
        title="خانه اپ"
        meta={<span>{faNum(activeCount)} اسلاید فعال</span>}
        actions={
          <Link href="/admin/home?new=1" className={btnPrimary}>
            <Add className="h-4 w-4" />
            اسلاید جدید
          </Link>
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Surface>
          <div className="divide-y divide-slate-100">
            {slides.length === 0 ? (
              <div className="p-5">
                <EmptyState title="هنوز اسلایدی ساخته نشده است." />
              </div>
            ) : (
              slides.map((slide) => {
                const active = selected?.id === slide.id;
                const beforeSrc = storageUrlFromKeyOrUrl(slide.beforeStorageKey, slide.beforeImageUrl) || slide.beforeImageUrl;
                const afterSrc = storageUrlFromKeyOrUrl(slide.afterStorageKey, slide.afterImageUrl) || slide.afterImageUrl;

                return (
                  <Link
                    key={slide.id}
                    href={`/admin/home?slide=${slide.id}`}
                    aria-current={active ? "true" : undefined}
                    className={`grid grid-cols-[72px_minmax(0,1fr)] gap-3 px-3 py-3 transition ${active ? "bg-navy-50" : "hover:bg-navy-25"}`}
                  >
                    <span className="grid h-20 grid-cols-2 gap-0.5 overflow-hidden rounded-lg bg-slate-100">
                      <span className="relative min-h-0">
                        <Image src={beforeSrc} alt="" fill unoptimized className="object-cover" sizes="72px" />
                        <span className="absolute right-1 top-1 rounded-full bg-black/55 px-1.5 py-0.5 text-[9px] font-semibold text-white backdrop-blur">قبل</span>
                      </span>
                      <span className="relative min-h-0">
                        <Image src={afterSrc} alt="" fill unoptimized className="object-cover" sizes="72px" />
                        <span className="absolute right-1 top-1 rounded-full bg-white/85 px-1.5 py-0.5 text-[9px] font-semibold text-navy-950 backdrop-blur">بعد</span>
                      </span>
                    </span>
                    <span className="min-w-0 self-center">
                      <span className={`block truncate text-sm ${active ? "font-semibold text-navy-950" : "text-navy-900"}`}>
                        {slide.title || "اسلاید بدون عنوان"}
                      </span>
                      <span className="mt-1 block text-xs text-slate-400">
                        ترتیب {faNum(slide.sortOrder)} · {slide.isActive ? "فعال" : "پنهان"}
                      </span>
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </Surface>

        {creating ? (
          <CreateSlidePanel nextSortOrder={slides.length * 10 + 10} />
        ) : selected ? (
          <EditSlidePanel slide={selected} />
        ) : null}
      </div>
    </>
  );
}

function BeforeAfterPreview({
  beforeSrc,
  afterSrc,
  beforeAlt = "",
  afterAlt = "",
}: {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt?: string;
  afterAlt?: string;
}) {
  return (
    <div className="grid max-w-sm grid-cols-2 gap-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm">
        <Image src={beforeSrc} alt={beforeAlt} fill unoptimized className="object-cover" sizes="160px" />
        <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">قبل</span>
      </div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm">
        <Image src={afterSrc} alt={afterAlt} fill unoptimized className="object-cover" sizes="160px" />
        <span className="absolute right-2 top-2 rounded-full bg-white/85 px-2 py-1 text-[10px] font-semibold text-navy-950 shadow-sm backdrop-blur">بعد</span>
      </div>
    </div>
  );
}

function CreateSlidePanel({ nextSortOrder }: { nextSortOrder: number }) {
  const fallback = fallbackHomeCarouselImages()[0];

  return (
    <Surface>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-navy-950">اسلاید جدید</h2>
        <Link href="/admin/home" className={btnSecondary}>
          انصراف
        </Link>
      </div>
      <form action={createHomeCarouselSlideAction} className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid max-w-2xl content-start gap-4">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_110px]">
            <Field label="عنوان داخلی">
              <input name="title" placeholder="مثلا گوشواره طلایی" className={fieldClass} />
            </Field>
            <Field label="ترتیب">
              <input name="sortOrder" type="number" defaultValue={nextSortOrder} className={fieldClass} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="عکس قبل">
              <input name="beforeImage" type="file" accept="image/jpeg,image/png,image/webp" required className={fieldClass} />
            </Field>
            <Field label="عکس بعد">
              <input name="afterImage" type="file" accept="image/jpeg,image/png,image/webp" required className={fieldClass} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Alt قبل">
              <input name="beforeAlt" placeholder="تصویر خام محصول" className={fieldClass} />
            </Field>
            <Field label="Alt بعد">
              <input name="afterAlt" placeholder="خروجی استودیویی محصول" className={fieldClass} />
            </Field>
          </div>
          <label className="inline-flex items-center gap-2 text-xs font-medium text-navy-900">
            <input name="isActive" type="checkbox" defaultChecked className={checkboxClass} />
            در کاروسل خانه نمایش داده شود
          </label>
          <button className={btnPrimary}>
            <Add className="h-4 w-4" />
            ساخت اسلاید
          </button>
        </div>

        <div className="grid content-start gap-2">
          <BeforeAfterPreview
            beforeSrc={fallback.beforeSrc || fallback.src}
            beforeAlt={fallback.beforeAlt}
            afterSrc={fallback.src}
            afterAlt={fallback.alt}
          />
        </div>
      </form>
    </Surface>
  );
}

function EditSlidePanel({
  slide,
}: {
  slide: HomeCarouselSlide;
}) {
  const beforeSrc = storageUrlFromKeyOrUrl(slide.beforeStorageKey, slide.beforeImageUrl) || slide.beforeImageUrl;
  const afterSrc = storageUrlFromKeyOrUrl(slide.afterStorageKey, slide.afterImageUrl) || slide.afterImageUrl;

  return (
    <Surface>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-navy-950">{slide.title || "اسلاید بدون عنوان"}</h2>
          <p dir="ltr" className="mt-0.5 text-xs text-slate-400">{slide.id}</p>
        </div>
        <ConfirmAction
          action={deleteHomeCarouselSlideAction}
          fields={[{ name: "slideId", value: slide.id }]}
          title="اسلاید حذف شود؟"
          description="این اسلاید از کاروسل خانه حذف می‌شود."
          confirmLabel="حذف"
          triggerLabel="حذف"
          triggerClassName={btnDanger}
          triggerIcon="trash"
        />
      </div>

      <form action={updateHomeCarouselSlideAction} className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <input type="hidden" name="slideId" value={slide.id} />
        <input type="hidden" name="beforeImageUrl" value={slide.beforeImageUrl} />
        <input type="hidden" name="afterImageUrl" value={slide.afterImageUrl} />
        <div className="grid max-w-2xl content-start gap-4">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_110px]">
            <Field label="عنوان داخلی">
              <input name="title" defaultValue={slide.title || ""} className={fieldClass} />
            </Field>
            <Field label="ترتیب">
              <input name="sortOrder" type="number" defaultValue={slide.sortOrder} className={fieldClass} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="عکس قبل جدید">
              <input name="beforeImage" type="file" accept="image/jpeg,image/png,image/webp" className={fieldClass} />
            </Field>
            <Field label="عکس بعد جدید">
              <input name="afterImage" type="file" accept="image/jpeg,image/png,image/webp" className={fieldClass} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Alt قبل">
              <input name="beforeAlt" defaultValue={slide.beforeAlt || ""} className={fieldClass} />
            </Field>
            <Field label="Alt بعد">
              <input name="afterAlt" defaultValue={slide.afterAlt || ""} className={fieldClass} />
            </Field>
          </div>
          <label className="inline-flex items-center gap-2 text-xs font-medium text-navy-900">
            <input name="isActive" type="checkbox" defaultChecked={slide.isActive} className={checkboxClass} />
            در کاروسل خانه نمایش داده شود
          </label>
          <button className={btnPrimary}>
            <Save2 className="h-4 w-4" />
            ذخیره تغییرات
          </button>
        </div>

        <BeforeAfterPreview
          beforeSrc={beforeSrc}
          beforeAlt={slide.beforeAlt || ""}
          afterSrc={afterSrc}
          afterAlt={slide.afterAlt || ""}
        />
      </form>
    </Surface>
  );
}
