import Link from "next/link";
import { ArchiveBook, DocumentDownload, Trash } from "vuesax-icons-react";
import {
  btnDanger,
  btnPrimary,
  cellClass,
  ConsoleHeader,
  ConsoleTable,
  EmptyState,
  faNum,
  formatAdminFullDate,
  StatusDot,
  Surface,
} from "@/features/admin/components/console";
import { createAdminBackupAction, deleteAdminBackupAction } from "@/features/admin/backup-actions";
import { requireAdminSession } from "@/lib/auth/session";
import { listBackupArchives } from "@/lib/backups";

export const dynamic = "force-dynamic";

type AdminBackupsPageProps = {
  searchParams?: Promise<{ created?: string; error?: string }>;
};

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / 1024 / 1024 / 1024).toLocaleString("fa-IR", { maximumFractionDigits: 2 })} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024)).toLocaleString("fa-IR")} KB`;
}

export default async function AdminBackupsPage({ searchParams }: AdminBackupsPageProps) {
  await requireAdminSession();
  const [params, backups] = await Promise.all([searchParams, listBackupArchives()]);

  return (
    <>
      <ConsoleHeader
        title="پشتیبان‌گیری"
        meta={<span>{faNum(backups.length)} فایل نگهداری‌شده · آخرین ۳ بکاپ حفظ می‌شود</span>}
        actions={
          <form action={createAdminBackupAction}>
            <button className={btnPrimary}>
              <ArchiveBook className="h-4 w-4" />
              ساخت بکاپ
            </button>
          </form>
        }
      />

      {params?.created ? (
        <Surface className="px-4 py-3 text-sm font-medium text-emerald-700">
          بکاپ ساخته شد: <span dir="ltr">{params.created}</span>
        </Surface>
      ) : null}

      {params?.error ? (
        <Surface className="px-4 py-3 text-sm font-medium text-rose-700">
          ساخت بکاپ کامل نشد: {params.error}
        </Surface>
      ) : null}

      <Surface>
        <ConsoleTable
          head={["فایل", "نوع", "Storage", "حجم", "زمان", ""]}
          empty={<EmptyState title="هنوز بکاپی ساخته نشده است." />}
        >
          {backups.map((backup) => (
            <tr key={backup.fileName}>
              <td className={cellClass}>
                <p className="max-w-sm truncate font-mono text-xs font-semibold" dir="ltr">
                  {backup.fileName}
                </p>
                {backup.sha256 ? (
                  <p className="max-w-sm truncate font-mono text-[10px] text-slate-400" dir="ltr">
                    sha256:{backup.sha256}
                  </p>
                ) : null}
              </td>
              <td className={cellClass}>
                <StatusDot status={backup.source === "automatic" ? "ACTIVE" : "PENDING"} label={backup.source === "automatic" ? "خودکار" : "دستی"} />
              </td>
              <td className={cellClass}>
                <p className="text-xs font-medium text-navy-950">{backup.storageDriver || "نامشخص"}</p>
                {backup.missingOrSkipped ? (
                  <p className="text-xs text-amber-700">{faNum(backup.missingOrSkipped)} فایل ناقص</p>
                ) : null}
              </td>
              <td className={`${cellClass} tabular-nums`}>{formatBytes(backup.sizeBytes)}</td>
              <td className={`${cellClass} text-xs text-slate-500`}>{formatAdminFullDate(backup.createdAt)}</td>
              <td className={cellClass}>
                <div className="flex justify-end gap-1.5">
                  <Link href={`/admin/backups/${encodeURIComponent(backup.fileName)}`} className={btnPrimary}>
                    <DocumentDownload className="h-4 w-4" />
                    دانلود
                  </Link>
                  <form action={deleteAdminBackupAction}>
                    <input type="hidden" name="fileName" value={backup.fileName} />
                    <button className={btnDanger}>
                      <Trash className="h-4 w-4" />
                      حذف
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </ConsoleTable>
      </Surface>
    </>
  );
}
