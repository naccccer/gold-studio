import Image from "next/image";
import Link from "next/link";
import { Add, Save2 } from "vuesax-icons-react";
import type { Prisma } from "@/generated/prisma";
import { ConfirmAction } from "@/components/ui/confirm-action";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  checkboxClass,
  ConsoleHeader,
  Disclosure,
  EmptyState,
  faNum,
  Field,
  fieldClass,
  KeyValueList,
  StatusDot,
  Surface,
  TabNav,
  textareaClass,
} from "@/features/admin/components/console";
import {
  createCreativeStyleAction,
  createStyleControlAction,
  deleteStyleControlAction,
  updateCreativeStyleAction,
  updateStyleControlAction,
} from "@/features/admin/actions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type ControlType = "CHOICE" | "RANGE" | "BOOLEAN";

const controlTypeLabels: Record<ControlType, string> = {
  CHOICE: "انتخابی",
  RANGE: "اسلایدی",
  BOOLEAN: "تیک‌زدنی",
};

const hiddenLegacyStyleIds = new Set(["style_warm_luxury"]);

function isEffectivelyUserVisible(style: { id: string; isActive: boolean; isUserVisible: boolean }) {
  return style.isActive && style.isUserVisible && !hiddenLegacyStyleIds.has(style.id);
}

const tabs = [
  { key: "overview", label: "نمای کلی" },
  { key: "prompt", label: "پرامپت" },
  { key: "controls", label: "کنترل‌ها" },
  { key: "visibility", label: "نمایش" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

type AdminStylesPageProps = {
  searchParams?: Promise<{ style?: string; tab?: string; new?: string }>;
};

export default async function AdminStylesPage({ searchParams }: AdminStylesPageProps) {
  const params = await searchParams;
  const styles = await db.creativeStyle.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      category: true,
      controls: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { sortOrder: "asc" } },
      _count: { select: { projects: true } },
    },
  });

  const creating = params?.new === "1";
  const selected = (!creating && styles.find((style) => style.id === params?.style)) || (creating ? null : styles[0] ?? null);
  const activeTab: TabKey = tabs.some((tab) => tab.key === params?.tab) ? (params?.tab as TabKey) : "overview";
  const visibleCount = styles.filter(isEffectivelyUserVisible).length;

  return (
    <>
      <ConsoleHeader
        title="کاتالوگ سبک‌ها"
        meta={<span>{faNum(visibleCount)} سبک قابل استفاده از {faNum(styles.length)}</span>}
        actions={
          <Link href="/admin/styles?new=1" className={btnPrimary}>
            <Add className="h-4 w-4" />
            سبک جدید
          </Link>
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Surface>
          <div className="max-h-[70vh] divide-y divide-slate-100 overflow-y-auto">
            {styles.length === 0 ? (
              <div className="p-4">
                <EmptyState title="هنوز سبکی ساخته نشده است." />
              </div>
            ) : (
              styles.map((style) => {
                const isSelected = !creating && selected?.id === style.id;
                return (
                  <Link
                    key={style.id}
                    href={`/admin/styles?style=${style.id}`}
                    aria-current={isSelected ? "true" : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 transition ${isSelected ? "bg-navy-50" : "hover:bg-navy-25"}`}
                  >
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      <Image src={style.previewImageUrl} alt="" fill className="object-cover" sizes="40px" />
                    </span>
                    <span className="min-w-0">
                      <span className={`block truncate text-sm ${isSelected ? "font-semibold text-navy-950" : "text-navy-900"}`}>
                        {style.name}
                      </span>
                      <StatusDot
                        status={isEffectivelyUserVisible(style) ? "ACTIVE" : "PAUSED"}
                        label={isEffectivelyUserVisible(style) ? "قابل استفاده" : "پنهان"}
                        className="!text-[11px] !text-slate-500"
                      />
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </Surface>

        {creating ? (
          <CreateStylePanel nextSortOrder={styles.length * 10 + 10} />
        ) : selected ? (
          <StyleDetail style={selected} activeTab={activeTab} />
        ) : (
          <Surface className="p-8">
            <EmptyState title="سبکی برای نمایش نیست.">برای شروع یک سبک جدید بسازید.</EmptyState>
          </Surface>
        )}
      </div>
    </>
  );
}

function CreateStylePanel({ nextSortOrder }: { nextSortOrder: number }) {
  return (
    <Surface>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-navy-950">سبک جدید</h2>
        <Link href="/admin/styles" className={btnSecondary}>
          انصراف
        </Link>
      </div>
      <form action={createCreativeStyleAction} className="grid max-w-2xl gap-4 p-5">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_110px]">
          <Field label="نام سبک">
            <input name="name" required placeholder="مثلا پس‌زمینه سفید" className={fieldClass} />
          </Field>
          <Field label="ترتیب">
            <input name="sortOrder" type="number" defaultValue={nextSortOrder} className={fieldClass} />
          </Field>
        </div>
        <Field label="توضیح کوتاه برای کاربر">
          <input name="description" required className={fieldClass} />
        </Field>
        <Field label="پرامپت داخلی">
          <textarea name="prompt" required rows={5} dir="ltr" className={`${textareaClass} text-left font-mono text-xs leading-6`} />
        </Field>
        <Field label="نشانی تصویر پیش‌نمایش" hint="در صورت خالی ماندن، تصویر پیش‌فرض استفاده می‌شود.">
          <input
            name="previewImageUrl"
            defaultValue="/images/placeholders/jewelry/style-minimal.webp"
            dir="ltr"
            className={`${fieldClass} text-left`}
          />
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-navy-900">
            <input name="isAvailableToUsers" type="checkbox" className={checkboxClass} />
            بعد از ساخت برای کاربران قابل استفاده باشد
          </label>
          <button className={btnPrimary}>
            <Add className="h-4 w-4" />
            ساخت سبک
          </button>
        </div>
      </form>
    </Surface>
  );
}

type StyleWithRelations = Prisma.CreativeStyleGetPayload<{
  include: {
    category: true;
    controls: true;
    variants: true;
    _count: { select: { projects: true } };
  };
}>;

function StyleDetail({ style, activeTab }: { style: StyleWithRelations; activeTab: TabKey }) {
  const visible = isEffectivelyUserVisible(style);

  return (
    <div className="min-w-0 space-y-4">
      <Surface>
        <div className="flex flex-wrap items-center gap-4 px-5 py-4">
          <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
            <Image src={style.previewImageUrl} alt={style.name} fill className="object-cover" sizes="56px" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold text-navy-950">{style.name}</h2>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <StatusDot status={visible ? "ACTIVE" : "PAUSED"} label={visible ? "قابل استفاده برای کاربر" : "پنهان از کاربر"} />
              <span>{faNum(style._count.projects)} پروژه</span>
              <span>{faNum(style.controls.length)} کنترل</span>
              <span dir="ltr" className="text-slate-400">{style.id}</span>
            </p>
          </div>
        </div>
        <div className="px-5">
          <TabNav
            tabs={tabs.map((tab) => ({
              href: `/admin/styles?style=${style.id}&tab=${tab.key}`,
              label: tab.label,
              active: activeTab === tab.key,
              count: tab.key === "controls" ? style.controls.length : undefined,
            }))}
          />
        </div>

        <div className="p-5">
          {activeTab === "overview" ? <OverviewTab style={style} /> : null}
          {activeTab === "prompt" ? <PromptTab style={style} /> : null}
          {activeTab === "controls" ? <ControlsTab style={style} /> : null}
          {activeTab === "visibility" ? <VisibilityTab style={style} visible={visible} /> : null}
        </div>
      </Surface>
    </div>
  );
}

/** فیلدهای دست‌نخورده سبک را برای ذخیره ایمن فرم‌های متمرکز همراه می‌فرستد. */
function HiddenStyleFields({
  style,
  except,
}: {
  style: StyleWithRelations;
  except: Array<"name" | "description" | "prompt" | "previewImageUrl" | "sortOrder" | "visibility">;
}) {
  const visible = isEffectivelyUserVisible(style);
  return (
    <>
      <input type="hidden" name="styleId" value={style.id} />
      {except.includes("name") ? null : <input type="hidden" name="name" value={style.name} />}
      {except.includes("description") ? null : <input type="hidden" name="description" value={style.description} />}
      {except.includes("prompt") ? null : <input type="hidden" name="prompt" value={style.prompt} />}
      {except.includes("previewImageUrl") ? null : <input type="hidden" name="previewImageUrl" value={style.previewImageUrl} />}
      {except.includes("sortOrder") ? null : <input type="hidden" name="sortOrder" value={style.sortOrder} />}
      {except.includes("visibility") || !visible ? null : <input type="hidden" name="isAvailableToUsers" value="on" />}
    </>
  );
}

function OverviewTab({ style }: { style: StyleWithRelations }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_240px]">
      <form action={updateCreativeStyleAction} className="grid max-w-xl content-start gap-4">
        <HiddenStyleFields style={style} except={["name", "description", "previewImageUrl", "sortOrder"]} />
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_110px]">
          <Field label="نام سبک">
            <input name="name" required defaultValue={style.name} className={fieldClass} />
          </Field>
          <Field label="ترتیب">
            <input name="sortOrder" type="number" defaultValue={style.sortOrder} className={fieldClass} />
          </Field>
        </div>
        <Field label="توضیح کوتاه در UI کاربر">
          <input name="description" required defaultValue={style.description} className={fieldClass} />
        </Field>
        <Field label="نشانی تصویر پیش‌نمایش">
          <input name="previewImageUrl" defaultValue={style.previewImageUrl} dir="ltr" className={`${fieldClass} text-left`} />
        </Field>
        <div>
          <button className={btnPrimary}>
            <Save2 className="h-4 w-4" />
            ذخیره تغییرات
          </button>
        </div>
      </form>
      <div className="content-start">
        <KeyValueList
          items={[
            { label: "دسته", value: style.category?.name ?? "بدون دسته" },
            { label: "تعداد گونه", value: faNum(style.variants.length) },
            { label: "پروژه‌های ساخته‌شده", value: faNum(style._count.projects) },
          ]}
        />
      </div>
    </div>
  );
}

function PromptTab({ style }: { style: StyleWithRelations }) {
  return (
    <div className="grid gap-4">
      <pre
        dir="ltr"
        className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-navy-950 px-4 py-3 text-left font-mono text-xs leading-6 text-navy-100"
      >
        {style.prompt}
      </pre>
      <Disclosure summary="ویرایش پرامپت">
        <form action={updateCreativeStyleAction} className="grid gap-3">
          <HiddenStyleFields style={style} except={["prompt"]} />
          <textarea
            name="prompt"
            required
            defaultValue={style.prompt}
            rows={10}
            dir="ltr"
            className={`${textareaClass} text-left font-mono text-xs leading-6`}
          />
          <div>
            <button className={btnPrimary}>
              <Save2 className="h-4 w-4" />
              ذخیره پرامپت
            </button>
          </div>
        </form>
      </Disclosure>
    </div>
  );
}

function ControlTypeSelect({ defaultValue }: { defaultValue: ControlType }) {
  return (
    <select name="type" defaultValue={defaultValue} className={fieldClass}>
      {Object.entries(controlTypeLabels).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

function ControlFormFields({
  control,
  nextSortOrder,
}: {
  control?: StyleWithRelations["controls"][number];
  nextSortOrder?: number;
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="برچسب">
          <input name="label" required defaultValue={control?.label} placeholder="مثلا سایه نرم" className={fieldClass} />
        </Field>
        <Field label="کلید">
          <input name="key" required defaultValue={control?.key} placeholder="softShadow" dir="ltr" className={`${fieldClass} text-left`} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="نوع">
          <ControlTypeSelect defaultValue={(control?.type as ControlType) ?? "CHOICE"} />
        </Field>
        <Field label="مقدار پیش‌فرض">
          <input name="defaultValue" defaultValue={control?.defaultValue ?? ""} dir="ltr" className={`${fieldClass} text-left`} />
        </Field>
        <Field label="ترتیب">
          <input name="sortOrder" type="number" defaultValue={control?.sortOrder ?? nextSortOrder ?? 10} className={fieldClass} />
        </Field>
      </div>
      <Field label="گزینه‌ها (برای نوع انتخابی)" hint='ساختار JSON مانند [{"value":"low","label":"کم"}]'>
        <input name="optionsJson" defaultValue={control?.optionsJson ?? ""} dir="ltr" className={`${fieldClass} text-left font-mono`} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="کمینه (برای نوع اسلایدی)">
          <input name="minValue" type="number" defaultValue={control?.minValue ?? ""} className={fieldClass} />
        </Field>
        <Field label="بیشینه (برای نوع اسلایدی)">
          <input name="maxValue" type="number" defaultValue={control?.maxValue ?? ""} className={fieldClass} />
        </Field>
      </div>
      <label className="inline-flex items-center gap-2 text-xs font-medium text-navy-900">
        <input name="isActive" type="checkbox" defaultChecked={control ? control.isActive : true} className={checkboxClass} />
        در فرم کاربر نمایش داده شود
      </label>
    </>
  );
}

function ControlsTab({ style }: { style: StyleWithRelations }) {
  return (
    <div className="grid gap-4">
      <p className="text-xs text-slate-500">گزینه‌هایی که کاربر هنگام انتخاب این سبک می‌بیند. برای ویرایش، هر کنترل را باز کنید.</p>
      {style.controls.length === 0 ? (
        <EmptyState title="کنترلی برای این سبک ثبت نشده است." />
      ) : (
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {style.controls.map((control) => (
            <Disclosure
              key={control.id}
              flush
              summary={
                <>
                  <StatusDot status={control.isActive ? "ACTIVE" : "PAUSED"} label="" />
                  <span className="truncate font-medium text-navy-950">{control.label}</span>
                  <span className="truncate text-[11px] text-slate-400" dir="ltr">
                    {control.key}
                  </span>
                  <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[10px] font-medium text-navy-700">
                    {controlTypeLabels[control.type as ControlType] ?? control.type}
                  </span>
                </>
              }
            >
              <form action={updateStyleControlAction} className="grid gap-3">
                <input type="hidden" name="controlId" value={control.id} />
                <ControlFormFields control={control} />
                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <button className={btnPrimary}>
                    <Save2 className="h-4 w-4" />
                    ذخیره کنترل
                  </button>
                  <ConfirmAction
                    action={deleteStyleControlAction}
                    fields={[{ name: "controlId", value: control.id }]}
                    title="کنترل حذف شود؟"
                    description="این گزینه از فرم سبک کاربر حذف می‌شود."
                    confirmLabel="حذف"
                    triggerLabel="حذف کنترل"
                    triggerClassName={btnDanger}
                    triggerIcon="trash"
                  />
                </div>
              </form>
            </Disclosure>
          ))}
        </div>
      )}

      <Disclosure
        summary={
          <>
            <Add className="h-4 w-4 text-slate-400" />
            افزودن کنترل جدید
          </>
        }
      >
        <form action={createStyleControlAction} className="grid gap-3">
          <input type="hidden" name="styleId" value={style.id} />
          <ControlFormFields nextSortOrder={style.controls.length * 10 + 10} />
          <div className="border-t border-slate-100 pt-3">
            <button className={btnPrimary}>
              <Add className="h-4 w-4" />
              افزودن کنترل
            </button>
          </div>
        </form>
      </Disclosure>
    </div>
  );
}

function VisibilityTab({ style, visible }: { style: StyleWithRelations; visible: boolean }) {
  return (
    <div className="grid max-w-xl gap-4">
      <div className="flex items-center justify-between gap-3 rounded-xl bg-navy-25 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-navy-950">وضعیت فعلی</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {visible ? "این سبک در فرم پروژه جدید کاربران نمایش داده می‌شود." : "این سبک از کاربران پنهان است."}
          </p>
        </div>
        <StatusDot status={visible ? "ACTIVE" : "PAUSED"} label={visible ? "قابل استفاده" : "پنهان"} />
      </div>

      <form action={updateCreativeStyleAction} className="grid gap-3">
        <HiddenStyleFields style={style} except={["visibility"]} />
        <label className="inline-flex items-center gap-2 text-sm font-medium text-navy-900">
          <input name="isAvailableToUsers" type="checkbox" defaultChecked={visible} className={checkboxClass} />
          قابل استفاده برای کاربران
        </label>
        <div>
          <button className={btnPrimary}>
            <Save2 className="h-4 w-4" />
            ثبت وضعیت نمایش
          </button>
        </div>
      </form>

      {hiddenLegacyStyleIds.has(style.id) ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
          این سبک به‌صورت سیستمی از کاربران پنهان شده و با تغییر گزینه بالا هم نمایش داده نمی‌شود.
        </p>
      ) : null}
    </div>
  );
}
