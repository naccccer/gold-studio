import Image from "next/image";
import Link from "next/link";
import { CloseCircle, TickCircle } from "vuesax-icons-react";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
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
import { approveQualityReviewAction, rejectQualityReviewAction } from "@/features/admin/actions";
import { getUserDisplayName, getUserIdentifier } from "@/lib/auth/user-identity";
import { db } from "@/lib/db";
import { uploadPreview } from "@/lib/placeholders/jewelry-images";
import { qualityReviewReasonLabel } from "@/lib/quality-review";
import { storageUrlFromKeyOrUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

type AdminQualityReviewsPageProps = {
  searchParams?: Promise<{ status?: string }>;
};

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
  const params = await searchParams;
  const status = normalizeStatus(params?.status);
  const where = status === "ALL" ? {} : { status: status as "PENDING" | "APPROVED" | "REJECTED" };
  const [reviews, pendingCount, approvedCount, rejectedCount] = await Promise.all([
    db.qualityReview.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 60,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        project: {
          include: {
            style: { select: { name: true } },
            sourceAsset: { select: { storageKey: true, fileUrl: true } },
          },
        },
        reviewedByAdmin: { select: { name: true, email: true, phone: true } },
      },
    }),
    db.qualityReview.count({ where: { status: "PENDING" } }),
    db.qualityReview.count({ where: { status: "APPROVED" } }),
    db.qualityReview.count({ where: { status: "REJECTED" } }),
  ]);

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

      <SegmentedLinks
        items={[
          { href: "/admin/quality-reviews", label: "در انتظار", active: status === "PENDING", count: pendingCount },
          { href: "/admin/quality-reviews?status=APPROVED", label: "تاییدشده", active: status === "APPROVED", count: approvedCount },
          { href: "/admin/quality-reviews?status=REJECTED", label: "ردشده", active: status === "REJECTED", count: rejectedCount },
          { href: "/admin/quality-reviews?status=ALL", label: "همه", active: status === "ALL" },
        ]}
      />

      {reviews.length === 0 ? (
        <Surface className="p-8">
          <EmptyState title="درخواستی با این وضعیت نیست." />
        </Surface>
      ) : (
        <div className="grid gap-5">
          {reviews.map((review) => {
            const sourceUrl = storageUrlFromKeyOrUrl(review.project.sourceAsset?.storageKey, review.project.sourceAsset?.fileUrl) || uploadPreview.src;
            const resultUrl = storageUrlFromKeyOrUrl(review.project.resultStorageKey, review.project.resultImageUrl) || uploadPreview.src;
            const aiScore = typeof review.aiScore === "number" ? `${Math.round(review.aiScore * 100).toLocaleString("fa-IR")}٪` : "نامشخص";

            return (
              <Surface key={review.id}>
                <div className="grid gap-5 p-5 xl:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.1fr)]">
                  <div className="grid grid-cols-2 gap-3">
                    <ImageBlock title="عکس خام" src={sourceUrl} />
                    <ImageBlock title="خروجی" src={resultUrl} />
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
    </>
  );
}

function ImageBlock({ title, src }: { title: string; src: string }) {
  return (
    <figure className="m-0">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
        <Image src={src} alt={title} fill unoptimized className="object-cover" sizes="320px" />
      </div>
      <figcaption className="mt-1.5 text-[11px] font-medium text-slate-500">{title}</figcaption>
    </figure>
  );
}
