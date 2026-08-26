import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma";
import { CloseCircle, TickCircle } from "vuesax-icons-react";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  AdminPagination,
  ConsoleHeader,
  EmptyState,
  faNum,
  Field,
  fieldClass,
  formatAdminDate,
  KeyValueList,
  SegmentedLinks,
  StatusDot,
  Surface,
} from "@/features/admin/components/console";
import { AdminImagePreview } from "@/features/admin/components/admin-image-preview";
import { approveQualityReviewAction, rejectQualityReviewAction } from "@/features/admin/actions";
import { getUserDisplayName, getUserIdentifier } from "@/lib/auth/user-identity";
import { formatInternalCreditUnits, getGenerationCreditUnitCost } from "@/lib/credit-units";
import { db } from "@/lib/db";
import { uploadPreview } from "@/lib/placeholders/jewelry-images";
import { qualityReviewReasonLabel } from "@/lib/quality-review";
import { requireAdminSession } from "@/lib/auth/session";
import { storageThumbnailUrlFromKeyOrUrl, storageUrlFromKeyOrUrl } from "@/lib/storage";
import { getVerticalLabel, normalizeVerticalId, USER_VISIBLE_VERTICAL_IDS, VERTICALS } from "@/lib/verticals";

export const dynamic = "force-dynamic";

type AdminQualityReviewsPageProps = {
  searchParams?: Promise<{ status?: string; vertical?: string; page?: string }>;
};

const PAGE_SIZE = 30;

function normalizeStatus(value?: string) {
  if (value === "APPROVED" || value === "REJECTED" || value === "ALL") {
    return value;
  }

  return "PENDING";
}

function recommendationLabel(value?: string | null) {
  if (value === "APPROVE") return "احتمالا تایید";
  if (value === "REJECT") return "احتمالا رد";
  if (value === "REVIEW") return "نیازمند بررسی";
  return "ثبت نشده";
}

export default async function AdminQualityReviewsPage({ searchParams }: AdminQualityReviewsPageProps) {
  await requireAdminSession();

  const params = await searchParams;
  const status = normalizeStatus(params?.status);
  const vertical = params?.vertical && params.vertical !== "ALL" ? normalizeVerticalId(params.vertical) : "ALL";
  const requestedPage = Number.parseInt(params?.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const verticalWhere: Prisma.QualityReviewWhereInput = vertical === "ALL" ? {} : { project: { vertical } };
  const where: Prisma.QualityReviewWhereInput = {
    ...verticalWhere,
    ...(status === "ALL" ? {} : { status: status as "PENDING" | "APPROVED" | "REJECTED" }),
  };
  const statusHref = (nextStatus: string) => {
    const query = new URLSearchParams();
    if (nextStatus !== "PENDING") query.set("status", nextStatus);
    if (vertical !== "ALL") query.set("vertical", vertical);
    const value = query.toString();
    return `/admin/quality-reviews${value ? `?${value}` : ""}`;
  };
  const [reviews, totalItems, pendingCount, approvedCount, rejectedCount] = await Promise.all([
    db.qualityReview.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        project: {
          include: {
            style: { select: { name: true } },
            sourceAsset: { select: { storageKey: true, fileUrl: true } },
            creditReservations: { orderBy: { createdAt: "desc" }, take: 1, select: { creditUnits: true } },
          },
        },
        reviewedByAdmin: { select: { name: true, email: true, phone: true } },
      },
    }),
    db.qualityReview.count({ where }),
    db.qualityReview.count({ where: { ...verticalWhere, status: "PENDING" } }),
    db.qualityReview.count({ where: { ...verticalWhere, status: "APPROVED" } }),
    db.qualityReview.count({ where: { ...verticalWhere, status: "REJECTED" } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  if (page > totalPages) {
    const query = new URLSearchParams();
    if (status !== "PENDING") query.set("status", status);
    if (vertical !== "ALL") query.set("vertical", vertical);
    if (totalPages > 1) query.set("page", String(totalPages));
    const value = query.toString();
    redirect(`/admin/quality-reviews${value ? `?${value}` : ""}`);
  }

  return (
    <>
      <ConsoleHeader
        title="بررسی کیفیت"
        meta={
          pendingCount > 0 ? (
            <span className="font-medium text-amber-700">{faNum(pendingCount)} درخواست در انتظار</span>
          ) : (
            <span>بدون درخواست باز</span>
          )
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedLinks
          items={[
            { href: statusHref("PENDING"), label: "در انتظار", active: status === "PENDING", count: pendingCount },
            { href: statusHref("APPROVED"), label: "تاییدشده", active: status === "APPROVED", count: approvedCount },
            { href: statusHref("REJECTED"), label: "ردشده", active: status === "REJECTED", count: rejectedCount },
            { href: statusHref("ALL"), label: "همه", active: status === "ALL" },
          ]}
        />
        <form className="flex items-center gap-2">
          {status !== "PENDING" ? <input type="hidden" name="status" value={status} /> : null}
          <select name="vertical" defaultValue={vertical} className={`${fieldClass} h-8 w-36 text-xs`}>
            <option value="ALL">All verticals</option>
            {USER_VISIBLE_VERTICAL_IDS.map((item) => (
              <option key={item} value={item}>
                {VERTICALS[item].label}
              </option>
            ))}
          </select>
          <button className={`${btnSecondary} h-8`}>اعمال</button>
        </form>
      </div>

      {reviews.length === 0 ? (
        <Surface className="p-8">
          <EmptyState title="درخواستی با این وضعیت نیست." />
        </Surface>
      ) : (
        <div className="grid gap-5">
          {reviews.map((review) => {
            const sourceUrl = storageUrlFromKeyOrUrl(review.project.sourceAsset?.storageKey, review.project.sourceAsset?.fileUrl) || uploadPreview.src;
            const resultUrl = storageUrlFromKeyOrUrl(review.project.resultStorageKey, review.project.resultImageUrl) || uploadPreview.src;
            const sourceThumbnailUrl =
              storageThumbnailUrlFromKeyOrUrl(review.project.sourceAsset?.storageKey, review.project.sourceAsset?.fileUrl, "preview") || sourceUrl;
            const resultThumbnailUrl =
              storageThumbnailUrlFromKeyOrUrl(review.project.resultStorageKey, review.project.resultImageUrl, "preview") || resultUrl;
            const aiScore = typeof review.aiScore === "number" ? `${Math.round(review.aiScore * 100).toLocaleString("fa-IR")}٪` : "نامشخص";
            const costUnits =
              review.project.creditReservations[0]?.creditUnits ?? getGenerationCreditUnitCost(normalizeVerticalId(review.project.vertical));

            return (
              <Surface key={review.id}>
                <div className="grid gap-5 p-5 xl:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.1fr)]">
                  <div className="grid grid-cols-2 gap-3">
                    <ImageBlock title="عکس خام" thumbnailSrc={sourceThumbnailUrl} originalSrc={sourceUrl} />
                    <ImageBlock title="خروجی" thumbnailSrc={resultThumbnailUrl} originalSrc={resultUrl} detailHref={`/admin/projects/${review.projectId}`} />
                  </div>

                  <div className="min-w-0 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/admin/projects/${review.projectId}`} className="text-sm font-semibold text-navy-950 hover:text-navy-700 hover:underline">
                          {review.project.title || "پروژه بدون عنوان"}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">
                          <Link href={`/admin/users/${review.userId}`} className="font-medium text-navy-700 hover:underline">
                            {getUserDisplayName(review.user)}
                          </Link>
                          <span className="mx-1.5 text-slate-300">·</span>
                          <span dir="ltr">{getUserIdentifier(review.user)}</span>
                        </p>
                      </div>
                      <StatusDot status={review.status} />
                    </div>

                    <KeyValueList
                      items={[
                        { label: "دلیل کاربر", value: qualityReviewReasonLabel(review.reason) },
                        { label: "Vertical", value: getVerticalLabel(review.project.vertical) },
                        { label: "هزینه/بازگشت", value: formatInternalCreditUnits(costUnits), dir: "ltr" },
                        { label: "سبک", value: review.project.style.name },
                        { label: "ثبت درخواست", value: formatAdminDate(review.createdAt) },
                        { label: "پیشنهاد AI", value: recommendationLabel(review.aiRecommendation) },
                        { label: "امتیاز حفظ محصول", value: aiScore, dir: "ltr" },
                      ]}
                    />

                    {review.userNote ? (
                      <p className="rounded-lg bg-navy-25 px-3 py-2 text-xs leading-6 text-slate-600">{review.userNote}</p>
                    ) : null}

                    {review.aiSummary || review.aiError ? (
                      <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-6 text-slate-600">
                        {review.aiSummary ? <p>{review.aiSummary}</p> : null}
                        {review.aiError ? <p className="text-rose-700">{review.aiError}</p> : null}
                      </div>
                    ) : null}

                    {review.status === "PENDING" ? (
                      <div className="grid gap-2 lg:grid-cols-2">
                        <form action={approveQualityReviewAction} className="grid gap-2">
                          <input type="hidden" name="reviewId" value={review.id} />
                          <Field label="یادداشت تایید">
                            <input name="adminNote" className={fieldClass} placeholder="اختیاری" />
                          </Field>
                          <button className={btnPrimary}>
                            <TickCircle className="h-4 w-4" />
                            تایید و بازگشت اعتبار
                          </button>
                        </form>
                        <form action={rejectQualityReviewAction} className="grid gap-2">
                          <input type="hidden" name="reviewId" value={review.id} />
                          <Field label="توضیح رد">
                            <input name="adminNote" className={fieldClass} placeholder="اختیاری" />
                          </Field>
                          <button className={btnDanger}>
                            <CloseCircle className="h-4 w-4" />
                            رد درخواست
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <StatusDot status={review.status} />
                        {review.reviewedByAdmin ? <span>توسط {getUserDisplayName(review.reviewedByAdmin)}</span> : null}
                        {review.adminNote ? <span>· {review.adminNote}</span> : null}
                        <Link href={`/admin/projects/${review.projectId}`} className={btnSecondary}>
                          مشاهده پروژه
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </Surface>
            );
          })}
        </div>
      )}
      <AdminPagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        hrefForPage={(nextPage) => {
          const query = new URLSearchParams();
          if (status !== "PENDING") query.set("status", status);
          if (vertical !== "ALL") query.set("vertical", vertical);
          if (nextPage > 1) query.set("page", String(nextPage));
          const value = query.toString();
          return `/admin/quality-reviews${value ? `?${value}` : ""}`;
        }}
      />
    </>
  );
}

function ImageBlock({ title, thumbnailSrc, originalSrc, detailHref }: { title: string; thumbnailSrc: string; originalSrc: string; detailHref?: string }) {
  return (
    <figure className="m-0">
      <AdminImagePreview
        thumbnailSrc={thumbnailSrc}
        originalSrc={originalSrc}
        alt={title}
        sizes="320px"
        className="aspect-square w-full rounded-xl bg-slate-100"
        detailHref={detailHref}
      />
      <figcaption className="mt-1.5 text-[11px] font-medium text-slate-500">{title}</figcaption>
    </figure>
  );
}
