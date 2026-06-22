import type { Prisma, UserNotificationSource, UserNotificationType } from "@/generated/prisma";
import { db } from "@/lib/db";

export type NotificationPreview = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  type: UserNotificationType;
  source: UserNotificationSource;
  readAt: Date | null;
  createdAt: Date;
};

type DbClient = Prisma.TransactionClient | typeof db;

type NotificationInput = {
  userId: string;
  title: string;
  body: string;
  type?: UserNotificationType;
  source?: UserNotificationSource;
  href?: string | null;
  createdByAdminId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

function cleanText(value: string, maxLength: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function normalizeHref(value?: string | null) {
  const href = value?.trim();
  if (!href || href.startsWith("http://") || href.startsWith("https://") || !href.startsWith("/")) {
    return null;
  }

  return href.slice(0, 191);
}

export async function createUserNotification(input: NotificationInput, client: DbClient = db) {
  const title = cleanText(input.title, 120);
  const body = cleanText(input.body, 1200);

  if (!input.userId || !title || !body) {
    return null;
  }

  return client.userNotification.create({
    data: {
      userId: input.userId,
      title,
      body,
      type: input.type ?? "SYSTEM",
      source: input.source ?? "SYSTEM",
      href: normalizeHref(input.href),
      createdByAdminId: input.createdByAdminId || null,
      metadata: input.metadata,
    },
  });
}

export async function createAdminUserNotification(input: Omit<NotificationInput, "type" | "source">) {
  return createUserNotification({
    ...input,
    type: "ADMIN",
    source: "ADMIN",
  });
}

export async function createAdminBroadcastNotification({
  title,
  body,
  href,
  createdByAdminId,
}: {
  title: string;
  body: string;
  href?: string | null;
  createdByAdminId: string;
}) {
  const cleanTitle = cleanText(title, 120);
  const cleanBody = cleanText(body, 1200);
  if (!cleanTitle || !cleanBody) {
    return 0;
  }

  const users = await db.user.findMany({
    select: { id: true },
  });

  if (users.length === 0) {
    return 0;
  }

  const result = await db.userNotification.createMany({
    data: users.map((user) => ({
      userId: user.id,
      title: cleanTitle,
      body: cleanBody,
      type: "ADMIN",
      source: "ADMIN",
      href: normalizeHref(href),
      createdByAdminId,
      metadata: { broadcast: true },
    })),
  });

  return result.count;
}

export async function getUserNotificationSummary(userId: string) {
  const [unreadCount, recent] = await Promise.all([
    db.userNotification.count({ where: { userId, readAt: null } }),
    db.userNotification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        body: true,
        href: true,
        type: true,
        source: true,
        readAt: true,
        createdAt: true,
      },
    }),
  ]);

  return { unreadCount, recent };
}

export async function markUserNotificationRead(userId: string, notificationId: string) {
  await db.userNotification.updateMany({
    where: { id: notificationId, userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markAllUserNotificationsRead(userId: string) {
  await db.userNotification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
