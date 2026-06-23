"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createBackupArchive, deleteBackupArchive } from "@/lib/backups";
import { requireAdminSession } from "@/lib/auth/session";
import { logAdminAudit } from "@/lib/billing";

function formText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createAdminBackupAction() {
  const session = await requireAdminSession();
  let redirectTo = "/admin/backups";

  try {
    const result = await createBackupArchive(session.userId);
    revalidatePath("/admin/backups");
    redirectTo = `/admin/backups?created=${encodeURIComponent(result.fileName)}`;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backup failed.";
    redirectTo = `/admin/backups?error=${encodeURIComponent(message)}`;
  }

  redirect(redirectTo);
}

export async function deleteAdminBackupAction(formData: FormData) {
  const session = await requireAdminSession();
  const fileName = formText(formData, "fileName");
  if (!fileName) return;

  await deleteBackupArchive(fileName);
  await logAdminAudit({
    actorAdminId: session.userId,
    action: "backup.delete",
    targetType: "Backup",
    targetId: fileName,
    summary: "فایل بکاپ حذف شد.",
  });

  revalidatePath("/admin/backups");
  redirect("/admin/backups");
}
