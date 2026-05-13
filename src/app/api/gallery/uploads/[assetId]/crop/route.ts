import { NextResponse } from "next/server";
import { after } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { analyzeAndStoreProductAssetVision } from "@/lib/product-vision";
import { generateNumericSupportCode, logSupportError } from "@/lib/support-code";
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
    return NextResponse.json({ error: "فایل کراپ‌شده معتبر نیست." }, { status: 400 });
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
        status: "READY",
        archivedAt: null,
        visionShortTitle: null,
        visionDescription: null,
        visionAngle: null,
        visionQualityIssues: null,
        visionConfidence: null,
        visionModel: null,
        visionAnalyzedAt: null,
        visionError: null,
      },
      select: {
        id: true,
        fileUrl: true,
        title: true,
      },
    });
    after(async () => {
      const analyzed = await analyzeAndStoreProductAssetVision(updatedAsset.id);
      if (!updatedAsset.title && analyzed?.visionShortTitle) {
        await db.productAsset.update({
          where: { id: updatedAsset.id },
          data: { title: analyzed.visionShortTitle },
        });
      }
    });

    return NextResponse.json({
      assetId: updatedAsset.id,
      fileUrl: updatedAsset.fileUrl,
    });
  } catch (error) {
    const supportCode = generateNumericSupportCode(asset.id);
    logSupportError("gallery.crop", supportCode, error, {
      userId: session.userId,
      assetId: asset.id,
      fileName: image.name,
      fileSize: image.size,
    });

    return NextResponse.json(
      {
        error: "ذخیره نسخه ویرایش‌شده کامل نشد. دوباره تلاش کنید و اگر تکرار شد، کد پیگیری را برای پشتیبانی بفرستید.",
        supportCode,
      },
      { status: 400 },
    );
  }
}
