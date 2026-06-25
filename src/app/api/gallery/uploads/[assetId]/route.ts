import { NextResponse } from "next/server";
import { after } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { cleanupAbandonedGalleryUploads } from "@/lib/gallery-upload-cleanup";
import { deleteStorageObject } from "@/lib/storage";
import { generateNumericSupportCode, logSupportError } from "@/lib/support-code";
import { resolveVerticalFromRequest } from "@/lib/verticals";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ assetId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "نشست کاربر معتبر نیست." }, { status: 401 });
  }
  const vertical = resolveVerticalFromRequest(request);

  after(() => cleanupAbandonedGalleryUploads({ userId: session.userId }).catch((error) => {
    console.error("[gallery-temp-upload-cleanup-failed]", error);
  }));

  const { assetId } = await context.params;
  const asset = await db.productAsset.findFirst({
    where: {
      id: assetId,
      userId: session.userId,
      vertical,
    },
    select: {
      id: true,
      storageKey: true,
      _count: {
        select: { batchItems: true, projects: true },
      },
    },
  });

  if (!asset) {
    return NextResponse.json({ ok: true });
  }

  const supportingProjectsCount = await db.projectSupportingAsset.count({
    where: { assetId: asset.id },
  });

  if (asset._count.projects > 0 || asset._count.batchItems > 0 || supportingProjectsCount > 0) {
    return NextResponse.json({ error: "این تصویر در پروژه استفاده شده و حذف نمی‌شود." }, { status: 409 });
  }

  try {
    await db.productAsset.delete({ where: { id: asset.id } });
    await deleteStorageObject(asset.storageKey);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const supportCode = generateNumericSupportCode(asset.id);
    logSupportError("gallery.upload.discard", supportCode, error, {
      userId: session.userId,
      assetId: asset.id,
    });

    return NextResponse.json(
      {
        error: "حذف تصویر نیمه‌کاره کامل نشد.",
        supportCode,
      },
      { status: 400 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ assetId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "نشست کاربر معتبر نیست." }, { status: 401 });
  }
  const vertical = resolveVerticalFromRequest(request);

  after(() => cleanupAbandonedGalleryUploads({ userId: session.userId }).catch((error) => {
    console.error("[gallery-temp-upload-cleanup-failed]", error);
  }));

  const { assetId } = await context.params;
  const asset = await db.productAsset.findFirst({
    where: {
      id: assetId,
      userId: session.userId,
      vertical,
    },
    select: {
      id: true,
      fileUrl: true,
      title: true,
      originalName: true,
    },
  });

  if (!asset) {
    return NextResponse.json({ error: "تصویر پیدا نشد." }, { status: 404 });
  }

  const updatedAsset = await db.productAsset.update({
    where: { id: asset.id },
    data: {
      status: "READY",
      archivedAt: null,
    },
    select: {
      id: true,
      fileUrl: true,
      title: true,
      originalName: true,
    },
  });

  return NextResponse.json({
    assetId: updatedAsset.id,
    fileUrl: updatedAsset.fileUrl,
    title: updatedAsset.title,
    originalName: updatedAsset.originalName,
  });
}
