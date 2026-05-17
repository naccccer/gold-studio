import { NextResponse } from "next/server";
import { after } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { analyzeAndStoreProductAssetVision } from "@/lib/product-vision";
import { generateNumericSupportCode, logSupportError } from "@/lib/support-code";
import { saveUploadedFile } from "@/lib/uploads";

function uploadErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return `${error.message} اگر مشکل تکرار شد، کد پیگیری را برای پشتیبانی بفرستید.`;
  }

  return "آپلود تصویر کامل نشد. ذخیره فایل روی سرور انجام نشد. دوباره تلاش کنید و اگر تکرار شد، کد پیگیری را برای پشتیبانی بفرستید.";
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "نشست کاربر معتبر نیست." }, { status: 401 });
  }

  const formData = await request.formData();
  const image = formData.get("image");

  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json({ error: "لطفاً یک تصویر معتبر انتخاب کنید." }, { status: 400 });
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
        title: null,
        status: "ARCHIVED",
        archivedAt: new Date(),
      },
      select: {
        id: true,
        fileUrl: true,
        title: true,
      },
    });
    after(async () => {
      const analyzed = await analyzeAndStoreProductAssetVision(asset.id);
      if (analyzed?.visionShortTitle) {
        await db.productAsset.update({
          where: { id: asset.id },
          data: { title: analyzed.visionShortTitle },
        });
      }
    });

    return NextResponse.json({
      assetId: asset.id,
      fileUrl: asset.fileUrl,
      title: asset.title ?? uploaded.originalName,
    });
  } catch (error) {
    const supportCode = generateNumericSupportCode();
    logSupportError("gallery.upload", supportCode, error, {
      userId: session.userId,
      fileName: image.name,
      fileSize: image.size,
    });

    return NextResponse.json(
      {
        error: uploadErrorMessage(error),
        supportCode,
      },
      { status: 400 },
    );
  }
}
