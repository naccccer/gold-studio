import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { saveUploadedFile } from "@/lib/uploads";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "نشست کاربر معتبر نیست." }, { status: 401 });
  }

  const formData = await request.formData();
  const image = formData.get("image");

  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json({ error: "لطفا یک تصویر معتبر انتخاب کنید." }, { status: 400 });
  }

  try {
    const uploaded = await saveUploadedFile(image);
    const asset = await db.productAsset.create({
      data: {
        userId: session.userId,
        fileUrl: uploaded.publicUrl,
        storageKey: uploaded.storageKey,
        mimeType: uploaded.mimeType,
        originalName: uploaded.originalName,
        title: uploaded.originalName,
      },
      select: {
        id: true,
        fileUrl: true,
        title: true,
      },
    });

    return NextResponse.json({
      assetId: asset.id,
      fileUrl: asset.fileUrl,
      title: asset.title,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "آپلود تصویر کامل نشد.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
