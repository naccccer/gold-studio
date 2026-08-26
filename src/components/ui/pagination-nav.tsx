import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export type PaginationState = {
  page: number;
  totalPages: number;
  totalItems: number;
  previousHref: string | null;
  nextHref: string | null;
};

export function PaginationNav({ pagination }: { pagination: PaginationState }) {
  if (pagination.totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-between gap-3 px-1" aria-label="صفحه‌بندی">
      <p className="text-xs text-muted">
        صفحه {pagination.page.toLocaleString("fa-IR")} از {pagination.totalPages.toLocaleString("fa-IR")}
      </p>
      <div className="flex items-center gap-2">
        {pagination.previousHref ? (
          <Link href={pagination.previousHref} className={buttonClasses({ variant: "secondary", size: "sm" })}>
            قبلی
          </Link>
        ) : null}
        {pagination.nextHref ? (
          <Link href={pagination.nextHref} className={buttonClasses({ variant: "secondary", size: "sm" })}>
            بعدی
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
