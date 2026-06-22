"use client";

import { useState } from "react";
import { NotificationBing, Send2 } from "vuesax-icons-react";
import { sendAdminNotificationAction } from "@/features/admin/actions";
import {
  btnPrimary,
  Field,
  fieldClass,
  textareaClass,
} from "@/features/admin/components/console";

type NotificationUserOption = {
  id: string;
  label: string;
};

type Template = {
  key: string;
  label: string;
  title: string;
  body: string;
  href: string;
};

const templates: Template[] = [
  {
    key: "quality-approved",
    label: "تایید بازگشت اعتبار",
    title: "اعتبار شما برگشت داده شد",
    body: "درخواست بررسی خروجی تایید شد و یک اعتبار به حساب شما برگشت.",
    href: "/account/notifications",
  },
  {
    key: "quality-reviewing",
    label: "بررسی کیفیت در حال انجام",
    title: "درخواست شما در حال بررسی است",
    body: "درخواست بررسی خروجی شما ثبت شده و پس از بررسی نتیجه از همین بخش اعلام می‌شود.",
    href: "/account/notifications",
  },
  {
    key: "receipt-needed",
    label: "یادآوری ارسال رسید",
    title: "رسید پرداخت را ارسال کنید",
    body: "برای تکمیل خرید، لطفا تصویر رسید پرداخت را از بخش پلن‌ها بارگذاری کنید.",
    href: "/billing?tab=receipts",
  },
  {
    key: "purchase-approved",
    label: "تایید خرید",
    title: "خرید شما تایید شد",
    body: "خرید شما بررسی و تایید شد. اعتبار یا اشتراک مربوط به حساب شما اضافه شده است.",
    href: "/billing",
  },
  {
    key: "support-reply",
    label: "پاسخ پشتیبانی",
    title: "پشتیبانی پاسخ داد",
    body: "پاسخ پشتیبانی برای شما ثبت شد. برای مشاهده جزئیات به بخش پشتیبانی بروید.",
    href: "/account/support",
  },
];

export function AdminNotificationForm({
  users = [],
  fixedUserId,
}: {
  users?: NotificationUserOption[];
  fixedUserId?: string;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [href, setHref] = useState("");
  const fixedUserMode = Boolean(fixedUserId);

  function applyTemplate(key: string) {
    const template = templates.find((item) => item.key === key);
    if (!template) return;

    setTitle(template.title);
    setBody(template.body);
    setHref(template.href);
  }

  return (
    <form action={sendAdminNotificationAction} className="grid gap-3">
      {fixedUserMode ? (
        <>
          <input type="hidden" name="audience" value="user" />
          <input type="hidden" name="userId" value={fixedUserId} />
        </>
      ) : (
        <>
          <Field label="مخاطب">
            <select name="audience" className={fieldClass} defaultValue="user">
              <option value="user">یک کاربر مشخص</option>
              <option value="broadcast">همه کاربران فعلی</option>
            </select>
          </Field>
          <Field label="کاربر">
            <select name="userId" className={fieldClass}>
              <option value="">انتخاب کاربر</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.label}
                </option>
              ))}
            </select>
          </Field>
        </>
      )}

      <Field label="پیام آماده">
        <select
          className={fieldClass}
          defaultValue=""
          onChange={(event) => applyTemplate(event.currentTarget.value)}
        >
          <option value="">بدون قالب آماده</option>
          {templates.map((template) => (
            <option key={template.key} value={template.key}>
              {template.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="عنوان">
        <input
          name="title"
          required
          maxLength={120}
          value={title}
          onChange={(event) => setTitle(event.currentTarget.value)}
          className={fieldClass}
        />
      </Field>
      <Field label="متن پیام">
        <textarea
          name="body"
          required
          maxLength={1200}
          value={body}
          onChange={(event) => setBody(event.currentTarget.value)}
          className={textareaClass}
        />
      </Field>
      <Field label="لینک داخلی اختیاری" hint="مثلا /projects یا /billing">
        <input
          name="href"
          dir="ltr"
          placeholder="/account"
          value={href}
          onChange={(event) => setHref(event.currentTarget.value)}
          className={`${fieldClass} text-left`}
        />
      </Field>
      <div>
        <button className={btnPrimary}>
          {fixedUserMode ? <NotificationBing className="h-4 w-4" /> : <Send2 className="h-4 w-4" />}
          ارسال پیام
        </button>
      </div>
    </form>
  );
}
