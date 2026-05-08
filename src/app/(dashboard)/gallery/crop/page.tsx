import { redirect } from "next/navigation";
import { requireUserSession } from "@/lib/auth/session";

export default async function GalleryCropPage({
  searchParams,
}: {
  searchParams?: Promise<{ uploadId?: string }>;
}) {
  await requireUserSession();
  const params = await searchParams;

  if (!params?.uploadId) {
    redirect("/gallery");
  }

  redirect(`/gallery?cropUploadId=${params.uploadId}`);
}
