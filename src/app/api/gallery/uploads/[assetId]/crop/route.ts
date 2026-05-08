import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { saveUploadedFile } from "@/lib/uploads";

export async function POST(
  request: Request,
  context: { params: Promise<{ assetId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "نشست کاربر معتبر نیست." }, { status: 401 });
  }

  const { assetId } = await context.params;
  const asset = await db.productAsset.findFirst({
    where: {
      id: assetId,
      userId: session.userId,
      status: "READY",
    },
    select: {
      id: true,
      title: true,
      originalName: true,
    },
  });

  if (!asset) {
    return NextResponse.json({ error: "فایل قابل ویرایش پیدا نشد." }, { status: 404 });
  }

  const formData = await request.formData();
  const image = formData.get("image");

  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json({ error: "فایل کراپ شده معتبر نیست." }, { status: 400 });
  }

  try {
    const uploaded = await saveUploadedFile(image);
    const updatedAsset = await db.productAsset.update({
      where: { id: asset.id },
      data: {
        fileUrl: uploaded.publicUrl,
        storageKey: uploaded.storageKey,
        mimeType: uploaded.mimeType,
        originalName: asset.originalName || uploaded.originalName,
        title: asset.title || asset.originalName || uploaded.originalName,
      },
      select: {
        id: true,
        fileUrl: true,
      },
    });

    return NextResponse.json({
      assetId: updatedAsset.id,
      fileUrl: updatedAsset.fileUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ذخیره کراپ کامل نشد.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
